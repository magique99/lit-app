import ViewProfileClient from "@/components/profile/ViewProfileClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProfileByIdPage({ params }: Props) {
  const { id } = await params;

  return <ViewProfileClient userId={id} />;
}
