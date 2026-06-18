import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";

const VideoCard = ({
  title,
  description,
  footer,
}: {
  title: string;
  description: string | null;
  footer: string;
}) => {
  return (
    <Card className="w-80">
      <CardContent>{title}</CardContent>
      <CardDescription className="px-4">{description}</CardDescription>
      <CardFooter>{footer}</CardFooter>
    </Card>
  );
};

export { VideoCard };
