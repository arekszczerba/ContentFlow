import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { PrismaClient } from '@prisma/client'; // Usunąłem CanonicalType, bo używamy stringa 'UNKNOWN'
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

@Processor('scraper')
export class ScraperProcessor {
  
  @Process('analyze-page')
  async handleAnalysis(job: Job<{ pageId: string; url: string; projectId: string }>) {
    const { pageId, url, projectId } = job.data;
    console.log(`🕵️ Scout 2.0: Analyzing structure of ${url}...`);

    try {
      // 1. Pobierz HTML
      const response = await axios.get(url, {
        timeout: 15000,
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
        }
      });
      
      // 2. Załaduj i Wyczyść
      const $ = cheerio.load(response.data);
      
      $('script, style, noscript, iframe, svg, link, meta').remove();
      $('*').contents().filter((_, el) => el.type === 'comment').remove();

      // 3. Znajdź Główny Kontener
      let root = $('main').first();
      if (root.length === 0) root = $('article').first();
      if (root.length === 0) root = $('body');

      // 4. Analiza Bloków
      const blocks = root.children();
      
      for (const block of blocks) {
        const $block = $(block);
        
        // POPRAWKA: Dodano bezpiecznik || 'UNKNOWN'
        const tagName = ($block.prop('tagName') || 'UNKNOWN').toUpperCase();
        
        // POPRAWKA: Dodano bezpiecznik || '' wewnątrz mapowania
        const childrenTags = $block.children().map((_, el) => 
          ($(el).prop('tagName') || '').toUpperCase()
        ).get().join(',');
        
        const structureSignature = `${tagName} > [${childrenTags}]`;
        
        const fingerprint = crypto.createHash('md5').update(structureSignature).digest('hex');

        const cleanHtml = ($block.html() || '').replace(/\s+/g, ' ').trim().substring(0, 1000);

        await prisma.contentBlockPattern.upsert({
          where: {
            projectId_fingerprint: {
              projectId,
              fingerprint
            }
          },
          update: {
            frequency: { increment: 1 }
          },
          create: {
            projectId,
            fingerprint,
            structure: structureSignature,
            exampleHtml: `<${tagName.toLowerCase()}>${cleanHtml}...</${tagName.toLowerCase()}>`,
            frequency: 1,
            canonicalType: 'UNKNOWN'
          }
        });
      }

      await prisma.page.update({
        where: { id: pageId },
        data: { status: 'ANALYZED' }
      });

      console.log(`✅ Scout 2.0: Finished ${url}. Found ${blocks.length} blocks.`);
      
    } catch (error) {
      // Obsługa błędów axiosa (które mogą nie mieć message wprost)
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Scout Error ${url}:`, msg);
      
      await prisma.page.update({ where: { id: pageId }, data: { status: 'ERROR' } });
    }
  }
  
}