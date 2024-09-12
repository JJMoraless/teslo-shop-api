import { BadRequestException } from '@nestjs/common';

export const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  callback: Function,
) => {
  const fileExtension = file.mimetype.split('/')[1];
  const validExtensions = ['jpg', 'jpeg', 'gif', 'png'];

  if (!validExtensions.includes(fileExtension)) {
    return callback(
      new BadRequestException(`File .${fileExtension} not valid mime type`),
      false,
    );
  }

  callback(null, true);
};
