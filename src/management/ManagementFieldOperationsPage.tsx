import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ManagementIcon } from "./ManagementIcon";
import { supabase } from "./supabase";
import { useManagementAuth } from "./AuthContext";
import type {
  CalendarEvent,
  CalendarEventType,
  Client,
  DiaryEntry,
  Project,
} from "./types";
import { clientDisplayName, formatDate, todayIso } from "./utils";
import {
  requestGoogleCalendarToken,
  syncGoogleCalendar,
} from "./googleCalendar";
const eventLabels: Record<CalendarEventType, string> = {
  inspection: "Sopralluogo",
  job: "Cantiere",
  delivery: "Consegna",
  follow_up: "Richiamo",
  other: "Altro",
};
const eventEmpty = {
  project_id: "",
  client_id: "",
  type: "job" as CalendarEventType,
  title: "",
  starts_at: `${todayIso()}T08:00`,
  ends_at: `${todayIso()}T17:00`,
  address: "",
  notes: "",
  completed: false,
};
const diaryEmpty = {
  project_id: "",
  work_date: todayIso(),
  start_time: "08:00",
  end_time: "17:00",
  workers: 1,
  area_completed_sqm: 0,
  temperature_c: "",
  conditions: "",
  work_done: "",
  issues: "",
  client_signature: "",
};
export function ManagementFieldOperationsPage() {
  const { session } = useManagementAuth();
  const [tab, setTab] = useState<"agenda" | "diary">("agenda");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [modal, setModal] = useState<"event" | "diary" | null>(null);
  const [eventForm, setEventForm] = useState({ ...eventEmpty });
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [googleToken, setGoogleToken] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [diaryForm, setDiaryForm] = useState({ ...diaryEmpty });
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const load = async () => {
    const [er, dr, pr, cr] = await Promise.all([
      supabase
        .from("calendar_events")
        .select(
          "*,projects(code,name),clients(company_name,contact_name)",
        )
        .is("deleted_at", null)
        .order("starts_at"),
      supabase
        .from("project_diary_entries")
        .select("*,project_diary_files(*)")
        .is("deleted_at", null)
        .order("work_date", { ascending: false }),
      supabase
        .from("projects")
        .select("*")
        .is("deleted_at", null)
        .order("code"),
      supabase
        .from("clients")
        .select("*")
        .is("deleted_at", null)
        .order("company_name"),
    ]);
    if (er.error || dr.error)
      setError("Esegui la migrazione business suite.");
    else {
      setEvents((er.data ?? []) as CalendarEvent[]);
      setEntries(
        (dr.data ?? []).map((e) => ({
          ...e,
          workers: Number(e.workers),
          area_completed_sqm: Number(e.area_completed_sqm),
          temperature_c:
            e.temperature_c === null ? null : Number(e.temperature_c),
        })) as DiaryEntry[],
      );
    }
    if (!pr.error) setProjects((pr.data ?? []) as Project[]);
    if (!cr.error) setClients((cr.data ?? []) as Client[]);
  };
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const saveEvent = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const payload = {
      ...eventForm,
      project_id: eventForm.project_id || null,
      client_id: eventForm.client_id || null,
      team_id: null,
      starts_at: new Date(eventForm.starts_at).toISOString(),
      ends_at: new Date(eventForm.ends_at).toISOString(),
    };
    const query = editingEventId
      ? supabase
          .from("calendar_events")
          .update(payload)
          .eq("id", editingEventId)
      : supabase.from("calendar_events").insert(payload);
    const { error: se } = await query;
    if (se) setError("Evento non salvato.");
    else {
      setModal(null);
      setEditingEventId(null);
      await load();
      if (googleToken) await runGoogleSync(googleToken);
    }
    setBusy(false);
  };
  const saveDiary = async (e: FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setBusy(true);
    setError("");
    const { data, error: se } = await supabase
      .from("project_diary_entries")
      .insert({
        ...diaryForm,
        team_id: null,
        temperature_c:
          diaryForm.temperature_c === ""
            ? null
            : Number(diaryForm.temperature_c),
      })
      .select("id")
      .single();
    if (se || !data) setError("Rapporto non salvato.");
    else {
      for (const file of files) {
        const path = `${session.user.id}/${data.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "-")}`;
        const upload = await supabase.storage
          .from("site-files")
          .upload(path, file, { contentType: file.type });
        if (!upload.error)
          await supabase
            .from("project_diary_files")
            .insert({
              entry_id: data.id,
              file_name: file.name,
              file_path: path,
              file_type: file.type,
              file_size: file.size,
            });
      }
      setModal(null);
      setMessage("Rapporto di cantiere salvato.");
      await load();
    }
    setBusy(false);
  };
  const archive = async (
    table: "calendar_events" | "project_diary_entries",
    id: string,
  ) => {
    await supabase
      .from(table)
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (table === "calendar_events" && googleToken)
      await runGoogleSync(googleToken);
    else await load();
  };
  const openEvent = (event?: CalendarEvent) => {
    if (event) {
      setEditingEventId(event.id);
      setEventForm({
        project_id: event.project_id ?? "",
        client_id: event.client_id ?? "",
        type: event.type,
        title: event.title,
        starts_at: localDateTime(event.starts_at),
        ends_at: localDateTime(event.ends_at),
        address: event.address,
        notes: event.notes,
        completed: event.completed,
      });
    } else {
      setEditingEventId(null);
      setEventForm({ ...eventEmpty });
    }
    setModal("event");
  };
  const runGoogleSync = async (token = googleToken) => {
    if (!token) return;
    setSyncing(true);
    setError("");
    setMessage("");
    try {
      const result = await syncGoogleCalendar(
        token,
        import.meta.env.VITE_GOOGLE_CALENDAR_ID || "primary",
      );
      await load();
      setMessage(
        `Google Calendar sincronizzato: ${result.exported} esportati, ${result.imported} importati, ${result.updated} aggiornati${result.removed ? `, ${result.removed} rimossi` : ""}.`,
      );
    } catch (syncError) {
      setError(
        syncError instanceof Error
          ? syncError.message
          : "Sincronizzazione Google non riuscita.",
      );
    }
    setSyncing(false);
  };
  const connectGoogle = async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError(
        "Inserisci VITE_GOOGLE_CLIENT_ID nel file .env e riavvia il server locale.",
      );
      return;
    }
    setSyncing(true);
    setError("");
    try {
      const token = await requestGoogleCalendarToken(clientId);
      setGoogleToken(token);
      await runGoogleSync(token);
    } catch (connectError) {
      setError(
        connectError instanceof Error
          ? connectError.message
          : "Collegamento Google non riuscito.",
      );
      setSyncing(false);
    }
  };
  const exportIcs = () => {
    const body = events
      .map(
        (ev) =>
          `BEGIN:VEVENT\r\nUID:${ev.id}@fastisol.it\r\nDTSTAMP:${icsDate(new Date())}\r\nDTSTART:${icsDate(new Date(ev.starts_at))}\r\nDTEND:${icsDate(new Date(ev.ends_at))}\r\nSUMMARY:${icsText(ev.title)}\r\nLOCATION:${icsText(ev.address)}\r\nDESCRIPTION:${icsText(ev.notes)}\r\nEND:VEVENT`,
      )
      .join("\r\n");
    downloadText(
      `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Fastisol//Gestionale//IT\r\n${body}\r\nEND:VCALENDAR`,
      "fastisol-agenda.ics",
      "text/calendar",
    );
  };
  const printReport = (entry: DiaryEntry) => {
    const project = projects.find((p) => p.id === entry.project_id);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(
      `<html><head><title>Rapporto ${escapeHtml(project?.code || "")}</title><style>body{font:14px Arial;padding:40px;color:#173745}h1{color:#106ba7}dl{display:grid;grid-template-columns:180px 1fr;gap:8px}img{max-width:260px;border:1px solid #ddd}</style></head><body><h1>Rapporto di cantiere</h1><h2>${escapeHtml(project?.code || "")} · ${escapeHtml(project?.name || "")}</h2><dl><dt>Data</dt><dd>${formatDate(entry.work_date)}</dd><dt>Orario</dt><dd>${entry.start_time || "—"}–${entry.end_time || "—"}</dd><dt>Esecutore</dt><dd>Titolare</dd><dt>Superficie</dt><dd>${entry.area_completed_sqm} mq</dd><dt>Condizioni</dt><dd>${escapeHtml(entry.conditions || "—")}</dd><dt>Lavori</dt><dd>${escapeHtml(entry.work_done)}</dd><dt>Problemi</dt><dd>${escapeHtml(entry.issues || "—")}</dd></dl>${entry.client_signature ? `<h3>Firma cliente</h3><img src="${entry.client_signature}"/>` : ""}<script>window.onload=()=>window.print()</script></body></html>`,
    );
    win.document.close();
  };
  const upcoming = events;
  return (
    <div>
      <div className="management-page-heading">
        <div>
          <span>Attività sul campo</span>
          <h1>Agenda e diario cantieri</h1>
          <p>
            Sopralluoghi, lavori, fotografie, ore, superfici e firma cliente.
          </p>
        </div>
        <div className="document-editor__top-actions">
          {tab === "agenda" && (
            <>
              <button
                className="management-secondary-button"
                disabled={syncing}
                onClick={() =>
                  void (googleToken ? runGoogleSync() : connectGoogle())
                }
              >
                <ManagementIcon name="calendar" />{" "}
                {syncing
                  ? "Sincronizzazione…"
                  : googleToken
                    ? "Sincronizza Google"
                    : "Collega Google Calendar"}
              </button>
              <button
                className="management-secondary-button"
                onClick={exportIcs}
              >
                <ManagementIcon name="download" /> Esporta ICS
              </button>
            </>
          )}
          <button
            className="management-primary-button"
            onClick={() => {
              if (tab === "agenda") openEvent();
              else if (tab === "diary") {
                setDiaryForm({
                  ...diaryEmpty,
                  project_id: projects[0]?.id ?? "",
                });
                setFiles([]);
                setModal("diary");
              }
            }}
          >
            <ManagementIcon name="plus" /> Nuovo
          </button>
        </div>
      </div>
      {error && (
        <div className="management-alert management-alert--error">{error}</div>
      )}
      {message && (
        <div className="management-alert management-alert--success">
          {message}
        </div>
      )}
      {tab === "agenda" && !import.meta.env.VITE_GOOGLE_CLIENT_ID && (
        <div className="management-alert management-alert--warning">
          Per attivare la sincronizzazione bidirezionale aggiungi{" "}
          <strong>VITE_GOOGLE_CLIENT_ID</strong> al file <strong>.env</strong>,
          autorizza l’origine del sito in Google Cloud e riavvia il server.
        </div>
      )}
      <div className="management-tabs">
        <button
          className={tab === "agenda" ? "is-active" : undefined}
          onClick={() => setTab("agenda")}
        >
          Agenda
        </button>
        <button
          className={tab === "diary" ? "is-active" : undefined}
          onClick={() => setTab("diary")}
        >
          Diario cantieri
        </button>
      </div>
      {tab === "agenda" && (
        <section className="management-card management-agenda-list">
          {upcoming.map((ev) => (
            <article key={ev.id}>
              <time>
                <strong>
                  {new Date(ev.starts_at).toLocaleDateString("it-IT", {
                    day: "2-digit",
                    month: "short",
                  })}
                </strong>
                <span>
                  {new Date(ev.starts_at).toLocaleTimeString("it-IT", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </time>
              <div>
                <span>
                  {eventLabels[ev.type]}
                  {ev.google_event_id ? " · Google Calendar" : ""}
                </span>
                <h3>{ev.title}</h3>
                <p>
                  {ev.projects
                    ? `${ev.projects.code} · ${ev.projects.name}`
                    : ev.clients
                      ? clientDisplayName(ev.clients)
                      : "Nessun collegamento"}{" "}
                  · Titolare
                </p>
                <small>{ev.address}</small>
                {ev.google_html_link && (
                  <a
                    href={ev.google_html_link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Apri in Google Calendar
                  </a>
                )}
              </div>
              <div className="management-row-actions">
                <button title="Modifica" onClick={() => openEvent(ev)}>
                  <ManagementIcon name="edit" />
                </button>
                <button
                  className="is-danger"
                  title="Elimina"
                  onClick={() => void archive("calendar_events", ev.id)}
                >
                  <ManagementIcon name="trash" />
                </button>
              </div>
            </article>
          ))}
          {upcoming.length === 0 && (
            <div className="management-empty">Nessun evento programmato.</div>
          )}
        </section>
      )}
      {tab === "diary" && (
        <section className="management-card">
          <div className="management-table-wrap">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Commessa</th>
                  <th>Esecutore</th>
                  <th>Ore</th>
                  <th>Superficie</th>
                  <th>Lavoro eseguito</th>
                  <th>Allegati</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {entries.map((en) => {
                  const p = projects.find((x) => x.id === en.project_id);
                  return (
                    <tr key={en.id}>
                      <td>{formatDate(en.work_date)}</td>
                      <td>{p ? `${p.code} · ${p.name}` : "—"}</td>
                      <td>Titolare</td>
                      <td>
                        {en.start_time || "—"}–{en.end_time || "—"}
                      </td>
                      <td>
                        {en.area_completed_sqm.toLocaleString("it-IT")} mq
                      </td>
                      <td>
                        {en.work_done}
                        <small>{en.issues}</small>
                      </td>
                      <td>{en.project_diary_files?.length ?? 0}</td>
                      <td>
                        <div className="management-row-actions">
                          <button
                            title="Stampa rapporto"
                            onClick={() => printReport(en)}
                          >
                            <ManagementIcon name="print" />
                          </button>
                          <button
                            className="is-danger"
                            onClick={() =>
                              void archive("project_diary_entries", en.id)
                            }
                          >
                            <ManagementIcon name="trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {modal === "event" && (
        <Modal
          title={editingEventId ? "Modifica evento" : "Nuovo evento"}
          close={() => setModal(null)}
        >
          <form
            className="management-form management-form--grid"
            onSubmit={(e) => void saveEvent(e)}
          >
            <label>
              <span>Tipo</span>
              <select
                value={eventForm.type}
                onChange={(e) =>
                  setEventForm((c) => ({
                    ...c,
                    type: e.target.value as CalendarEventType,
                  }))
                }
              >
                {Object.entries(eventLabels).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Titolo *</span>
              <input
                required
                value={eventForm.title}
                onChange={(e) =>
                  setEventForm((c) => ({ ...c, title: e.target.value }))
                }
              />
            </label>
            <label>
              <span>Inizio *</span>
              <input
                required
                type="datetime-local"
                value={eventForm.starts_at}
                onChange={(e) =>
                  setEventForm((c) => ({ ...c, starts_at: e.target.value }))
                }
              />
            </label>
            <label>
              <span>Fine *</span>
              <input
                required
                type="datetime-local"
                value={eventForm.ends_at}
                onChange={(e) =>
                  setEventForm((c) => ({ ...c, ends_at: e.target.value }))
                }
              />
            </label>
            <Selects
              projects={projects}
              clients={clients}
              project={eventForm.project_id}
              client={eventForm.client_id}
              set={(k, v) => setEventForm((c) => ({ ...c, [k]: v }))}
            />
            <label className="is-wide">
              <span>Indirizzo</span>
              <input
                value={eventForm.address}
                onChange={(e) =>
                  setEventForm((c) => ({ ...c, address: e.target.value }))
                }
              />
            </label>
            <label className="is-wide">
              <span>Note</span>
              <textarea
                rows={3}
                value={eventForm.notes}
                onChange={(e) =>
                  setEventForm((c) => ({ ...c, notes: e.target.value }))
                }
              />
            </label>
            <Actions busy={busy} close={() => setModal(null)} />
          </form>
        </Modal>
      )}
      {modal === "diary" && (
        <Modal
          title="Nuovo rapporto di cantiere"
          close={() => setModal(null)}
          wide
        >
          <form
            className="management-form management-form--grid"
            onSubmit={(e) => void saveDiary(e)}
          >
            <label className="is-wide">
              <span>Commessa *</span>
              <select
                required
                value={diaryForm.project_id}
                onChange={(e) =>
                  setDiaryForm((c) => ({ ...c, project_id: e.target.value }))
                }
              >
                <option value="">Seleziona</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} · {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Data *</span>
              <input
                required
                type="date"
                value={diaryForm.work_date}
                onChange={(e) =>
                  setDiaryForm((c) => ({ ...c, work_date: e.target.value }))
                }
              />
            </label>
            <label>
              <span>Inizio</span>
              <input
                type="time"
                value={diaryForm.start_time}
                onChange={(e) =>
                  setDiaryForm((c) => ({ ...c, start_time: e.target.value }))
                }
              />
            </label>
            <label>
              <span>Fine</span>
              <input
                type="time"
                value={diaryForm.end_time}
                onChange={(e) =>
                  setDiaryForm((c) => ({ ...c, end_time: e.target.value }))
                }
              />
            </label>
            <label>
              <span>Superficie completata mq</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={diaryForm.area_completed_sqm}
                onChange={(e) =>
                  setDiaryForm((c) => ({
                    ...c,
                    area_completed_sqm: Number(e.target.value),
                  }))
                }
              />
            </label>
            <label>
              <span>Temperatura °C</span>
              <input
                type="number"
                step="0.1"
                value={diaryForm.temperature_c}
                onChange={(e) =>
                  setDiaryForm((c) => ({ ...c, temperature_c: e.target.value }))
                }
              />
            </label>
            <label>
              <span>Condizioni</span>
              <input
                value={diaryForm.conditions}
                onChange={(e) =>
                  setDiaryForm((c) => ({ ...c, conditions: e.target.value }))
                }
              />
            </label>
            <label className="is-wide">
              <span>Lavori eseguiti *</span>
              <textarea
                required
                rows={4}
                value={diaryForm.work_done}
                onChange={(e) =>
                  setDiaryForm((c) => ({ ...c, work_done: e.target.value }))
                }
              />
            </label>
            <label className="is-wide">
              <span>Problemi / anomalie</span>
              <textarea
                rows={3}
                value={diaryForm.issues}
                onChange={(e) =>
                  setDiaryForm((c) => ({ ...c, issues: e.target.value }))
                }
              />
            </label>
            <label className="is-wide">
              <span>Foto e PDF</span>
              <input
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={(e) => setFiles([...(e.target.files ?? [])])}
              />
            </label>
            <div className="is-wide">
              <span className="management-field-label">Firma cliente</span>
              <Signature
                value={diaryForm.client_signature}
                onChange={(value) =>
                  setDiaryForm((c) => ({ ...c, client_signature: value }))
                }
              />
            </div>
            <Actions busy={busy} close={() => setModal(null)} />
          </form>
        </Modal>
      )}
    </div>
  );
}
function Modal({
  title,
  close,
  wide,
  children,
}: {
  title: string;
  close: () => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="management-modal">
      <button className="management-modal__backdrop" onClick={close} />
      <div
        className={`management-modal__panel${wide ? " management-modal__panel--wide" : ""}`}
      >
        <div className="management-modal__header">
          <div>
            <span>Operatività</span>
            <h2>{title}</h2>
          </div>
          <button onClick={close}>
            <ManagementIcon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Actions({ busy, close }: { busy: boolean; close: () => void }) {
  return (
    <div className="management-form__actions is-wide">
      <button
        type="button"
        className="management-secondary-button"
        onClick={close}
      >
        Annulla
      </button>
      <button className="management-primary-button" disabled={busy}>
        {busy ? "Salvataggio…" : "Salva"}
      </button>
    </div>
  );
}
function Selects({
  projects,
  clients,
  project,
  client,
  set,
}: {
  projects: Project[];
  clients: Client[];
  project: string;
  client: string;
  set: (key: "project_id" | "client_id", value: string) => void;
}) {
  return (
    <>
      <label>
        <span>Commessa</span>
        <select
          value={project}
          onChange={(e) => set("project_id", e.target.value)}
        >
          <option value="">Nessuna</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} · {p.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Cliente</span>
        <select
          value={client}
          onChange={(e) => set("client_id", e.target.value)}
        >
          <option value="">Nessuno</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {clientDisplayName(c)}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
function Signature({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const pos = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) * e.currentTarget.width) / r.width,
      y: ((e.clientY - r.top) * e.currentTarget.height) / r.height,
    };
  };
  const down = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    const p = pos(e);
    const c = ref.current?.getContext("2d");
    c?.beginPath();
    c?.moveTo(p.x, p.y);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const p = pos(e);
    const c = ref.current?.getContext("2d");
    if (c) {
      c.lineWidth = 2;
      c.lineCap = "round";
      c.strokeStyle = "#173745";
      c.lineTo(p.x, p.y);
      c.stroke();
    }
  };
  const up = () => {
    drawing.current = false;
    if (ref.current) onChange(ref.current.toDataURL("image/png"));
  };
  return (
    <div className="management-signature">
      <canvas
        ref={ref}
        width={600}
        height={180}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
      />
      <button
        type="button"
        onClick={() => {
          const c = ref.current;
          c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
          onChange("");
        }}
      >
        Cancella firma
      </button>
      {value && <small>Firma acquisita</small>}
    </div>
  );
}
function icsDate(d: Date) {
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}
function localDateTime(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
function icsText(v: string) {
  return v
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}
function downloadText(value: string, name: string, type: string) {
  const u = URL.createObjectURL(new Blob([value], { type }));
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  URL.revokeObjectURL(u);
}
function escapeHtml(v: string) {
  return v.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ] || c,
  );
}
