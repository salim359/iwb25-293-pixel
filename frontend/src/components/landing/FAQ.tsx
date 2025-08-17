import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is FlashGenius?",
      answer:
        "FlashGenius is an AI-powered platform that helps you generate flashcards, practice questions, and exam predictions for any subject in seconds.",
    },
    {
      question: "How do I generate flashcards or questions?",
      answer:
        "Simply enter your topic, notes, or study material, and our AI will instantly create high-quality flashcards and practice questions tailored to your needs.",
    },
    {
      question: "Is FlashGenius free to use?",
      answer:
        "Yes! You can start generating flashcards and questions for free. Premium features may be available for advanced users.",
    },
    {
      question: "How accurate are the exam predictions?",
      answer:
        "Our AI uses advanced algorithms and large datasets to provide exam predictions, but we recommend using them as a study aid, not a guarantee.",
    },
    {
      question: "Can I use FlashGenius for any subject?",
      answer:
        "Absolutely! FlashGenius supports a wide range of subjects, from science and math to history and languages.",
    },
    {
      question: "Do I need to create an account?",
      answer:
        "You can try basic features without an account, but signing up lets you save your flashcards, track progress, and access more tools.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="mt-24 lg:mx-24 mx-2" id="faq">
      <div className="text-center mb-12">
        <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-foreground">
          Frequently Asked Questions
        </h2>
        <p className="text-muted-foreground text-lg lg:text-xl max-w-2xl mx-auto">
          Everything you need to know about FlashGenius and how it helps you
          study smarter
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full px-6 py-6 text-left flex justify-between items-center hover:bg-accent transition-colors duration-200"
            >
              <h3 className="text-lg lg:text-xl font-semibold text-card-foreground pr-4">
                {faq.question}
              </h3>
              <div className="flex-shrink-0">
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </button>

            {openIndex === index && (
              <div className="px-6 pb-6">
                <div className="border-t border-border pt-4">
                  <p className="text-muted-foreground text-base lg:text-lg leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-center mt-12">
        <p className="text-muted-foreground text-lg">
          Still have questions?{" "}
          <a
            href="mailto:support@flashgenius.com"
            className="text-primary hover:text-primary/80 font-semibold underline underline-offset-2"
          >
            Contact our support team
          </a>
        </p>
      </div>
    </div>
  );
}
