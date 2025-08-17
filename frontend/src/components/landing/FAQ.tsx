import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is Pixel AI?",
      answer:
        "Pixel AI is an advanced platform that instantly generates flashcards, quizzes, and exam predictions for any subject using artificial intelligence.",
    },
    {
      question: "How do I use Pixel AI to create study materials?",
      answer:
        "Simply upload your PDF and start learning! Pixel AI will automatically generate flashcards, quizzes, and practice questions from your material so you can study smarter and faster.",
    },
    {
      question: "Is Pixel AI free to use?",
      answer:
        "Yes, Pixel AI is free for now! You can generate flashcards and quizzes without any cost. Premium features may be introduced in the future for advanced users.",
    },
    {
      question: "How reliable are the exam predictions from Pixel AI?",
      answer:
        "Pixel AI uses state-of-the-art algorithms and large datasets to provide exam predictions. These are designed to guide your study, but should be used as helpful insights, not guarantees.",
    },
    {
      question: "Can I use Pixel AI for any subject?",
      answer:
        "Absolutely! Pixel AI supports a wide range of subjects, from science and math to history, languages, and more.",
    },
    {
      question: "Do I need to create an account to use Pixel AI?",
      answer:
        "Yes, you must sign in to access all features of Pixel AI. Signing in lets you generate unlimited flashcards, save your progress, and unlock personalized study tools.",
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
          Everything you need to know about Pixel AI and how it helps you study
          smarter
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
            href="mailto:support@pixelai.com"
            className="text-primary hover:text-primary/80 font-semibold underline underline-offset-2"
          >
            Contact our support team
          </a>
        </p>
      </div>
    </div>
  );
}
