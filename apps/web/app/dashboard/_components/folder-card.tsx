import { Card, CardContent, CardDescription } from "@/components/ui/card";

const FolderCard = ({
  title,
  description,
}: {
  title: string;
  description: string | null;
}) => {
  return (
    <Card className="w-80">
      <CardContent>{title}</CardContent>
      <CardDescription className="px-4">{description}</CardDescription>
    </Card>
  );
};

export { FolderCard };
