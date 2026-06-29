import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TiendanubeController } from './tiendanube.controller';
import { TiendanubeService } from './tiendanube.service';

@Module({
  imports: [DatabaseModule],
  controllers: [TiendanubeController],
  providers: [TiendanubeService],
  exports: [TiendanubeService],
})
export class TiendanubeModule {}
