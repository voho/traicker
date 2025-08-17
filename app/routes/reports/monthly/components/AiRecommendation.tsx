export function AiRecommendation() {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl mb-4">AI doporučení</h3>
      <div className="bg-gray-700/20 p-5 rounded-lg">
        <p className="text-gray-300">
          Na základě vašich výdajů za poslední měsíc by bylo vhodné zvážit omezení výdajů v kategorii "Zábava", 
          která tvoří 25% vašeho rozpočtu. Průměrná domácnost v této kategorii utrácí přibližně 15%.
        </p>
      </div>
    </div>
  );
}
