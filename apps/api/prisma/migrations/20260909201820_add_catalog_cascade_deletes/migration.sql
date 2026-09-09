-- DropForeignKey
ALTER TABLE "DrinkIngredient" DROP CONSTRAINT "DrinkIngredient_drinkId_fkey";

-- DropForeignKey
ALTER TABLE "DrinkIngredient" DROP CONSTRAINT "DrinkIngredient_ingredientId_fkey";

-- AddForeignKey
ALTER TABLE "DrinkIngredient" ADD CONSTRAINT "DrinkIngredient_drinkId_fkey" FOREIGN KEY ("drinkId") REFERENCES "Drink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrinkIngredient" ADD CONSTRAINT "DrinkIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
