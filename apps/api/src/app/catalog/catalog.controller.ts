import { Controller, Get, Param } from '@nestjs/common';
import { DrinkDetailDto, DrinkDto } from '@tonic112/shared-types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CatalogService } from './catalog.service';

// No @Public() here — per architecture-and-product-spec.md Section 4/9,
// these are read endpoints for "any authenticated participant", meaning
// any valid JWT (registered user or party guest), not a fully anonymous
// request. The global JwtAuthGuard already accepts either token shape.
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  listDrinks(@CurrentUser() user: JwtPayload): Promise<DrinkDto[]> {
    return this.catalogService.listDrinks(user.isAdmin);
  }

  @Get(':id')
  getDrinkDetail(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<DrinkDetailDto> {
    return this.catalogService.getDrinkDetail(id, user.isAdmin);
  }
}
