import { useLoaderData } from "react-router-dom";
import { useMemo } from "react";
import BrandCard from "../components/BrandCard";
import CatalogCard from "../components/CatalogCard";

function Home() {
  const brands = useLoaderData();

  // Валидация и сортировка брендов
  const sortedBrands = useMemo(() => {
    if (!Array.isArray(brands)) {
      return [];
    }

    return brands
      .filter(brand => brand && brand.id && brand.name)
      .sort((a, b) => {
        // Алфавитная сортировка с учетом локали (кириллица)
        return a.name.localeCompare(b.name, 'ru', {
          sensitivity: 'base',
          ignorePunctuation: true
        });
      });
  }, [brands]);

  return (
    <div className="py-10 bg-[radial-gradient(circle,rgba(255,255,255,1)_0%,rgba(219,234,254,0.25)_50%,rgba(219,234,254,0.4)_100%)]">
      <div className="container px-3 sm:px-3 md:px-6 lg:px-12 xl:px-[75px] 2xl:px-[150px]">
        {sortedBrands.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-xl text-gray-600">Бренды не найдены</p>
          </div>
        ) : (
          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-2
              lg:grid-cols-[0.8fr,1fr,1fr]
              xl:grid-cols-[0.65fr,1fr,1fr,1fr]
              auto-rows-[minmax(140px,auto)]
              gap-4
            "
          >
            {/* ЛЕВАЯ КАРТОЧКА — КАТАЛОГ */}
            <div className="md:row-span-2 lg:row-span-2 xl:row-span-2">
              <CatalogCard />
            </div>

            {/* ПРАВЫЕ КОЛОНКИ — БРЕНДЫ */}
            {sortedBrands.map((brand) => (
              <div key={brand.id} className="h-full">
                <BrandCard brand={brand} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
