import { supabase } from './supabase'

export interface ConsumeMaterialInput {
  clientId: string
  projectId: string
  applicationDate: string
  declaredSqm: number
  referenceThicknessCm: number
  notes?: string
}

export interface ConsumeMaterialResult {
  consumption_id: string
  kits_consumed: number
  lots_used: number
}

export async function consumeMaterialFifo(input: ConsumeMaterialInput) {
  const { data, error } = await supabase.rpc('consume_material_fifo', {
    p_client_id: input.clientId,
    p_project_id: input.projectId,
    p_consumption_id: null,
    p_application_date: input.applicationDate,
    p_declared_sqm: input.declaredSqm,
    p_reference_thickness_cm: input.referenceThicknessCm,
    p_notes: input.notes ?? '',
  })
  if (error) throw new Error(error.message)
  return data as ConsumeMaterialResult
}

export function kitsFromSquareMeters(declaredSqm: number, yieldSqmPerKit: number) {
  if (declaredSqm <= 0 || yieldSqmPerKit <= 0) return 0
  return declaredSqm / yieldSqmPerKit
}

export async function registerMaterialLot(input: {
  producerLotNumber: string
  materialName: string
  componentA: string
  componentB: string
  quantityKits: number
  yieldSqmPerKit: number
  referenceThicknessCm: number
  entryDate: string
  supplierId: string
  deliveryNoteId: string
  notes?: string
}) {
  const { data, error } = await supabase.rpc('register_material_lot', {
    p_producer_lot_number: input.producerLotNumber,
    p_material_name: input.materialName,
    p_component_a: input.componentA,
    p_component_b: input.componentB,
    p_quantity_kits: input.quantityKits,
    p_yield_sqm_per_kit: input.yieldSqmPerKit,
    p_reference_thickness_cm: input.referenceThicknessCm,
    p_entry_date: input.entryDate,
    p_supplier_id: input.supplierId,
    p_delivery_note_id: input.deliveryNoteId,
    p_notes: input.notes ?? '',
  })
  if (error) throw new Error(error.message)
  return data as string
}

export async function adjustMaterialLot(lotId: string, quantityDeltaKits: number, notes: string) {
  const { data, error } = await supabase.rpc('adjust_material_lot', {
    p_material_lot_id: lotId,
    p_quantity_delta_kits: quantityDeltaKits,
    p_notes: notes,
  })
  if (error) throw new Error(error.message)
  return data as { before_kits: number; delta_kits: number; after_kits: number }
}

export async function applyWarrantyStock(input: { warrantyId: string; clientId: string; projectId: string; applicationDate: string; declaredSqm: number; referenceThicknessCm: number; notes?: string }) {
  const { data, error } = await supabase.rpc('apply_warranty_stock', {
    p_warranty_id: input.warrantyId,
    p_client_id: input.clientId,
    p_project_id: input.projectId,
    p_application_date: input.applicationDate,
    p_declared_sqm: input.declaredSqm,
    p_reference_thickness_cm: input.referenceThicknessCm,
    p_notes: input.notes ?? 'Consumo automatico da garanzia PDF',
  })
  if (error) throw new Error(error.message)
  return data as ConsumeMaterialResult
}
