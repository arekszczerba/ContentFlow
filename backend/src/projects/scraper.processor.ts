import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as cheerio from 'cheerio';

const prisma = new PrismaClient();

@Processor('scraper')
export class ScraperProcessor {
  
  @Process('analyze-page')
  async handleAnalysis(job: Job<{ pageId: string; url: string }>) {
    const { pageId, url } = job.data;
    console.log(`🕵️ Scout: Analyzing ${url}...`);

    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: { 'User-Agent': 'ContentFlow-Scout/1.0' }
      });
      const html = response.data;

      const $ = cheerio.load(html);

      const detectedClasses = new Set<string>();
      
      $('*[class]').each((_, element) => {
        const classes = $(element).attr('class');
        if (classes) {
          classes.split(/\s+/).forEach(c => {
            if (c.startsWith('wp-') || c.includes('block') || c.includes('hero')) {
              detectedClasses.add(c);
            }
          });
        }
      });

      const metaTitle = $('title').text();
      const metaDesc = $('meta[name="description"]').attr('content') || '';

      await prisma.page.update({
        where: { id: pageId },
        data: {
          status: 'ANALYZED',
          title: metaTitle || undefined,
          detectedComponents: {
            classes: Array.from(detectedClasses),
            metaDescription: metaDesc,
            structure: 'html-structure-placeholder'
          }
        }
      });

      console.log(`Scout: Finished ${url}`);
      
    } catch (error) {
      console.error(`Scout: Failed ${url}`, error.message);
      
      await prisma.page.update({
        where: { id: pageId },
        data: { status: 'ERROR' }
      });
    }
  }
}