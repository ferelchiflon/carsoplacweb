import { useState } from "react";
import { ChevronDown } from "lucide-react";

type FAQ = {
  question: string;
  answer: string;
};

const faqs: FAQ[] = [
  {
    question: "¿Hacen envíos a todo el país?",
    answer:
      "Sí, realizamos envíos a todas las provincias con transporte seguro y seguimiento.",
  },
  {
    question: "¿Tienen showroom?",
    answer:
      "Sí, contamos con un showroom donde podés ver todos nuestros productos.",
  },
  {
    question: "¿Los azulejos tienen garantía?",
    answer:
      "Sí, todos nuestros productos cuentan con garantía oficial de fábrica.",
  },
  {
    question: "¿Puedo pagar en cuotas?",
    answer:
      "Aceptamos tarjetas de crédito, débito y varios planes de financiación.",
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const headingId = "faq-heading";
  const regionId = "faq-region";

  return (
    <section
      role="region"
      id={regionId}
      aria-labelledby={headingId}
      className="w-full bg-shaded-fern px-4 py-8 text-white"
    >
      {/* Títulos */}
      <div className="text-center mb-6">
        <p className="text-sm uppercase tracking-wide text-sage-gray">FAQs</p>
        <h2 id={headingId} className="text-2xl font-bold">
          PREGUNTAS FRECUENTES
        </h2>
      </div>

      {/* Acordeón */}
      <div className="w-full mx-auto">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          const panelId = `faq-panel-${index}`;
          const buttonId = `faq-button-${index}`;
          return (
            <div key={index} className="border-b border-spruce-border py-3">
              <button
                id={buttonId}
                onClick={() => toggle(index)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="w-full h-14 flex justify-between items-center text-left"
              >
                <span className="text-base font-medium">{faq.question}</span>
                <ChevronDown
                  size={22}
                  className={`transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Respuesta */}
              {isOpen && (
                <p
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className="mt-2 text-sage-gray text-sm leading-tight mb-2"
                >
                  {faq.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
