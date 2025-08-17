import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Star } from "lucide-react";

const reviewsData = [
  {
    name: "Sarah Johnson",
    role: "Student",
    company: "University of Learning",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    review:
      "Pixel made my exam prep so much easier! The AI-generated quizzes and flashcards are spot on. I improved my grades in just a few weeks!",
  },
  {
    name: "Michael Chen",
    role: "Medical Student",
    company: "MedSchool",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    review:
      "I love how Pixel brings all my study tools together. Sharing notes with classmates is a game-changer!",
  },
  {
    name: "Emily Rodriguez",
    role: "Engineering Student",
    company: "Tech Institute",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    review:
      "The personalized study plans and adaptive quizzes helped me stay on track. Pixel is my go-to study buddy!",
  },
];

export default function Reviews() {
  return (
    <section
      className="relative py-24 px-4 lg:px-8 overflow-hidden"
      id="reviews"
    >
      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
            <Star className="w-4 h-4" />
            Loved by Pixel students
          </div>
          <h2 className="text-5xl lg:text-6xl font-bold pb-2 bg-gradient-to-r from-primary via-violet-500 to-violet-400 text-transparent bg-clip-text mb-6">
            Real Student Reviews
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See how Pixel is helping students study smarter and achieve more
          </p>
        </div>
        {/* Reviews Carousel */}
        <Carousel
          className="w-full"
          opts={{
            watchResize: true,
            loop: true,
            align: "start",
          }}
        >
          <CarouselContent className="-ml-2 lg:-ml-4">
            {reviewsData.map((review, index) => (
              <CarouselItem
                key={index}
                className="pl-2 lg:pl-4 basis-full md:basis-1/2 lg:basis-1/3"
              >
                <Review {...review} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex justify-center mt-8 gap-4">
            <CarouselPrevious className="static translate-y-0 h-12 w-12 border-2 hover:bg-primary/10 hover:border-primary transition-colors" />
            <CarouselNext className="static translate-y-0 h-12 w-12 border-2 hover:bg-primary/10 hover:border-primary transition-colors" />
          </div>
        </Carousel>
      </div>
    </section>
  );
}

function YellowStar({ filled = true }: { filled?: boolean }) {
  return (
    <Star
      className={`w-4 h-4 ${filled ? "text-primary fill-primary" : "text-muted-foreground"}`}
    />
  );
}

type ReviewProps = {
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
  review: string;
};

function Review({ name, role, company, avatar, rating, review }: ReviewProps) {
  return (
    <Card className="p-6 m-1 flex flex-col items-center bg-card text-card-foreground border border-border shadow-sm rounded-xl">
      <Avatar className="mb-4 size-16">
        <AvatarImage src={avatar} />
        <AvatarFallback>{name[0]}</AvatarFallback>
      </Avatar>
      <div className="flex mb-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <YellowStar key={index} filled={index < rating} />
        ))}
      </div>
      <p className="text-base text-muted-foreground mb-4 text-center">
        {review}
      </p>
      <div className="text-sm font-medium text-primary mb-1">{name}</div>
      <div className="text-xs text-muted-foreground">
        {role} &mdash; {company}
      </div>
    </Card>
  );
}
