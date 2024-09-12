import { join } from 'path';
import { existsSync } from 'fs';

import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class FilesService {
  findStaticProducImage(imageName: string) {
    const pathImg = join(__dirname, '../../static/uploads/', imageName);


    if (!existsSync(pathImg)) {
      throw new BadRequestException('Image not found');
    }

    return pathImg;
  }
}
