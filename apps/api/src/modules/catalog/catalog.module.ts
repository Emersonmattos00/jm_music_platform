import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { AdminCatalogController } from './admin-catalog.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  providers: [CatalogService],
  controllers: [CatalogController, AdminCatalogController],
  exports: [CatalogService],
})
export class CatalogModule {}