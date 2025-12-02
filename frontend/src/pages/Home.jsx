import { useLoaderData } from "react-router-dom";
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
          <div className="grid grid-cols-auto-fit-cards auto-rows-fr gap-[12px]">
            {sortedBrands.map((brand) => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
