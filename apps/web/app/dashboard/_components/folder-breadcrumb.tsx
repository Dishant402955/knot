import Link from "next/link";
import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const FolderBreadcrumb = ({
  segments,
}: {
  segments: {
    id: string | null;
    name: string;
    href?: string;
  }[];
}) => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => (
          <Fragment key={`${segment.id ?? "root"}-${index}`}>
            {index > 0 && <BreadcrumbSeparator />}

            <BreadcrumbItem>
              {segment.href ? (
                <BreadcrumbLink asChild>
                  <Link href={segment.href}>{segment.name}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{segment.name}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export { FolderBreadcrumb };
