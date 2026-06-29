import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  Param,
  Query,
  Logger,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { TiendanubeService } from './tiendanube.service';

@Controller('tiendanube')
export class TiendanubeController {
  private readonly logger = new Logger(TiendanubeController.name);

  constructor(private tiendanubeService: TiendanubeService) {}

  @Get('connect')
  async connect(@Headers('x-org-id') orgId: string) {
    if (!orgId) {
      throw new BadRequestException('orgId requerido');
    }
    return { url: this.tiendanubeService.getAuthUrl(orgId) };
  }

  @Post('callback')
  async callback(@Body('code') code: string, @Body('orgId') orgId: string) {
    if (!code || !orgId) {
      throw new BadRequestException('code y orgId son requeridos');
    }

    try {
      const { accessToken, storeId } = await this.tiendanubeService.exchangeCode(code);
      await this.tiendanubeService.saveAccount(orgId, storeId, accessToken);
      return { success: true, storeId };
    } catch (error) {
      this.logger.error('Error en callback de Tiendanube:', error);
      throw new HttpException({ success: false }, HttpStatus.BAD_GATEWAY);
    }
  }

  @Get('status')
  async status(@Headers('x-org-id') orgId: string) {
    if (!orgId) {
      throw new BadRequestException('orgId requerido');
    }
    const connected = await this.tiendanubeService.isConnected(orgId);
    return { connected };
  }

  @Get('products')
  async products(@Headers('x-org-id') orgId: string) {
    if (!orgId) {
      throw new BadRequestException('orgId requerido');
    }
    return this.tiendanubeService.getProducts(orgId);
  }

  @Get('products/search')
  async searchProducts(@Headers('x-org-id') orgId: string, @Query('q') q: string) {
    if (!orgId) {
      throw new BadRequestException('orgId requerido');
    }
    return this.tiendanubeService.searchProducts(orgId, q ?? '');
  }

  @Get('products/simplified')
  async simplifiedProducts(@Headers('x-org-id') orgId: string) {
    if (!orgId) {
      throw new BadRequestException('orgId requerido');
    }
    return this.tiendanubeService.getSimplifiedProducts(orgId);
  }

  @Get('products/:id')
  async productById(@Headers('x-org-id') orgId: string, @Param('id') id: string) {
    if (!orgId) {
      throw new BadRequestException('orgId requerido');
    }
    return this.tiendanubeService.getProductById(orgId, id);
  }
}
