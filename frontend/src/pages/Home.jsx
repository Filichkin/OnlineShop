import { useLoaderData, Link } from "react-router-dom";
import { useMemo } from "react";
import BrandCard from "../components/BrandCard";

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
              grid-cols-[0.65fr,1fr,1fr,1fr]
              auto-rows-[minmax(140px,auto)]
              gap-4
            "
          >
            {/* ЛЕВАЯ КАРТОЧКА — КАТАЛОГ */}
            <div className="row-span-2">
              <Link
                to="/catalog"
                className="
                  h-full w-full
                  bg-white rounded-3xl shadow
                  flex items-center justify-center
                  hover:shadow-lg transition-shadow
                  text-xl font-semibold text-gray-900
                  cursor-pointer
                "
              >
                Каталог
              </Link>
            </div>
  
            {/* ПРАВЫЕ 3 КОЛОНКИ — БРЕНДЫ */}
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
