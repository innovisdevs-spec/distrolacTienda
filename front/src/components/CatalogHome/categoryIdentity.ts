type CategoryReference = { _id?: string; name?: string } | string | null | undefined;
export const categoryId = (value: CategoryReference): string => typeof value === 'string' ? value : value?._id || '';
export const sameCategory = (a: CategoryReference, b: CategoryReference): boolean => Boolean(categoryId(a)) && categoryId(a) === categoryId(b);
