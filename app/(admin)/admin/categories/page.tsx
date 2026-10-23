import CategoryForm from '@/component/admin/CategoryForm';
import DeleteCategoryButton from '@/component/admin/DeleteCategoryButton';
import { requireAdmin } from '@/lib/auth/session';
import { getAllSubcategories, getCategories } from '@/lib/catalog/queries';
import { createCategory, createSubcategory, updateCategory, updateSubcategory, deleteCategory, deleteSubcategory } from './actions';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  await requireAdmin();
  const [categories, subcategories] = await Promise.all([getCategories(), getAllSubcategories()]);
  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-2xl font-bold">Categories</h1>
      <div className="flex flex-col gap-4">
        {categories.length === 0 && <p className="text-sm text-muted-foreground">No categories yet. Add your first one below.</p>}
        {categories.map((category) => (
          <div key={category.slug} className="rounded-xl border border-border bg-background p-5">
            <p className="font-bold">{category.name} <span className="font-normal text-muted-foreground">({category.slug})</span></p>
            <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
            <div className="mt-3 flex flex-wrap items-start gap-3">
              <details className="min-w-0 flex-1">
                <summary className="cursor-pointer text-sm font-semibold">Edit category</summary>
                <div className="mt-3 max-w-xl"><CategoryForm kind="category" defaults={category} action={updateCategory.bind(null, category.slug)} /></div>
              </details>
              <DeleteCategoryButton name={category.name} action={deleteCategory.bind(null, category.slug)} />
            </div>
            <ul className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
              {subcategories.filter((sub) => sub.categorySlug === category.slug).map((sub) => (
                <li key={sub.slug} className="flex flex-wrap items-start gap-3">
                  <details className="min-w-0 flex-1">
                    <summary className="cursor-pointer text-sm"><span className="rounded-full bg-muted px-3 py-1 text-xs">{sub.name}</span> <span className="text-xs text-muted-foreground">({sub.slug}) · Edit</span></summary>
                    <div className="mt-3 max-w-xl"><CategoryForm kind="subcategory" defaults={sub} action={updateSubcategory.bind(null, sub.slug)} /></div>
                  </details>
                  <DeleteCategoryButton name={sub.name} action={deleteSubcategory.bind(null, sub.slug)} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-xl border border-border p-5">
          <p className="font-semibold">Add Category</p>
          <CategoryForm kind="category" action={createCategory} />
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-border p-5">
          <p className="font-semibold">Add Subcategory</p>
          <CategoryForm kind="subcategory" categories={categories} action={createSubcategory} />
        </div>
      </div>
    </div>
  );
}
