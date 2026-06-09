import { VariantEditForm } from '@/components/admin/VariantEditForm'

export default async function VariantDetailPage({
  params,
}: {
  params: Promise<{ id: string; variantId: string }>
}) {
  const { id, variantId } = await params
  return <VariantEditForm productId={id} variantId={variantId} />
}
