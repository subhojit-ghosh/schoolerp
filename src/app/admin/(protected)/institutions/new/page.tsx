import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateInstitutionForm } from "@/components/platform/create-institution-form";

export default function NewInstitutionPage() {
  return (
    <div className="p-6">
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>New institution</CardTitle>
            <CardDescription>
              Create a new institution. The slug becomes its subdomain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateInstitutionForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
