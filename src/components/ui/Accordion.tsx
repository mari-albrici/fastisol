import { useId } from 'react'
import { Icon } from './Icon'

interface AccordionProps {
  question: string
  answer: string
}

export function Accordion({ question, answer }: AccordionProps) {
  const contentId = useId()

  return (
    <details className="accordion">
      <summary aria-controls={contentId}>
        <span>{question}</span>
        <span className="accordion__icon"><Icon name="arrow" size={20} /></span>
      </summary>
      <div className="accordion__content" id={contentId}>
        <p>{answer}</p>
      </div>
    </details>
  )
}
