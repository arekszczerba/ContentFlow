import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import csv from 'csv-parser';
import { Readable } from 'stream';

const prisma = new PrismaClient();

@Injectable()
export class ProjectsService {
  
  async findAll() {
    return prisma.project.findMany({
      include: { _count: { select: { pages: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async importCsv(fileBuffer: Buffer, filename: string, customName?: string) {
    const results: any[] = [];
    
    const stream = Readable.from(fileBuffer);

    return new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('error', (error) => reject(error))
        .on('end', async () => {

          const finalName = customName && customName.trim() !== '' 
            ? customName 
            : `Import: ${filename} (${new Date().toLocaleDateString()})`;
          
          const project = await prisma.project.create({
            data: {
              name: finalName,
            },
          });

          const pagesToCreate = results.map((row) => ({
            projectId: project.id,
            url: row['Page URL'],
            title: row['Page title'],
            language: row['Language'],
            targetUrl: row['New URL'],
            status: 'PENDING' as const,
          })).filter(page => page.url);

          const savedPages = await prisma.page.createMany({
            data: pagesToCreate,
            skipDuplicates: true, 
          });

          resolve({
            message: 'Success',
            projectId: project.id,
            importedCount: savedPages.count,
          });
        });
    });
  }
}