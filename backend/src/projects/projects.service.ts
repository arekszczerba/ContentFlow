import { Injectable } from '@nestjs/common';
import { PrismaClient, CanonicalType } from '@prisma/client'; 
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import csv from 'csv-parser';
import { Readable } from 'stream';


const prisma = new PrismaClient();

interface CreateRuleDto {
  name: string;
  selector: string;
  ruleType: 'GLOBAL' | 'CONTAINER' | 'COMPONENT';
  definitions?: any; 
  contentType?: string;
  attribute?: string;
}

@Injectable()
export class ProjectsService {
  constructor(
    @InjectQueue('scraper') private scraperQueue: Queue
  ) {}

  async findAll() {
    return prisma.project.findMany({
      include: { _count: { select: { pages: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    return prisma.project.findUnique({
      where: { id },
      include: {
        pages: {
          orderBy: { url: 'asc'}
        },
        _count: {
          select: { pages: true }
        }
      }
    })
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

          // 1. Ustalanie nazwy projektu
          const finalName = customName && customName.trim() !== '' 
            ? customName 
            : `Import: ${filename} (${new Date().toLocaleDateString()})`;
          
          // 2. Tworzenie projektu
          const project = await prisma.project.create({
            data: {
              name: finalName,
            },
          });

          // 3. Mapowanie CSV na obiekt Bazy Danych
          const pagesToCreate = results.map((row) => ({
            projectId: project.id,
            
            // Pola wymagane (muszą być w CSV)
            url: row['Page URL'], 
            
            // Pola opcjonalne (dajemy || null, żeby nie było undefined)
            title: row['Page title'] || null,
            language: row['Language'] || null,
            targetUrl: row['New URL'] || null,
            
            // --- NOWE POLA (Zgodne z Twoim nowym CSV) ---
            legacyTemplate: row['Legacy Template'] || null,
            newTemplate: row['New Template'] || null,
            // ---------------------------------------------

            status: 'PENDING' as const,
          })).filter(page => page.url); // Odrzucamy wiersze bez URL

          // 4. Zapis do bazy
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

async analyzeProject(projectId: string) {
    const pages = await prisma.page.findMany({
      where: { 
        projectId,
        status: { in: ['PENDING', 'ERROR'] }
      }
    });

    for (const page of pages) {
      await this.scraperQueue.add('analyze-page', {
        pageId: page.id,
        url: page.url,
        projectId: projectId
      });
    }

    return { message: `Queued ${pages.length} pages for analysis` };
  }

  async saveRule(projectId: string, ruleData: CreateRuleDto) {
    return prisma.extractionRule.create({
      data: {
        projectId,
        name: ruleData.name,
        selector: ruleData.selector,
        ruleType: ruleData.ruleType,
        definitions: ruleData.definitions || {},
        contentType: ruleData.contentType,
        attribute: ruleData.attribute,
      },
    });
  }

  async getProjectRules(projectId: string) {
    return prisma.extractionRule.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // async savePattern(projectId: string, data: { 
  //   selector: string; 
  //   isLayout: boolean; 
  //   componentType?: CanonicalType 
  // }) {
  //   return prisma.componentPattern.upsert({
  //     where: {
  //       projectId_selector: {
  //         projectId,
  //         selector: data.selector,
  //       },
  //     },
  //     update: {
  //       isLayout: data.isLayout,
  //       componentType: data.componentType || 'UNKNOWN',
  //       confidence: 1.0,
  //     },
  //     create: {
  //       projectId,
  //       selector: data.selector,
  //       isLayout: data.isLayout,
  //       componentType: data.componentType || 'UNKNOWN',
  //       confidence: 1.0,
  //     },
  //   });
  // }

  async getPatterns(projectId: string) {
    return prisma.contentBlockPattern.findMany({
      where: { projectId },
      orderBy: { frequency: 'desc' },
    });
  }

  async updatePattern(patternId: string, data: { 
    canonicalType: CanonicalType; 
    name?: string 
  }) {
    return prisma.contentBlockPattern.update({
      where: { id: patternId },
      data: {
        canonicalType: data.canonicalType,
      }
    });
  }
}