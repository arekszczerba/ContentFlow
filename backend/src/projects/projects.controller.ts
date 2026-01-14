import { Body, Controller, Get, Param, Post, UploadedFile, UseInterceptors, Res, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProjectsService } from './projects.service';
import type { Response } from 'express';
import axios from 'axios';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Get('proxy')
  async proxyPage(@Query('url') url: string, @Res() res: Response) {
    if (!url) return res.status(400).send('Missing URL');

    console.log(`🔌 Proxying: ${url}`);

    try {
      const response = await axios.get(url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        responseType: 'text',
        validateStatus: () => true,
      });

      console.log(`🔌 Status: ${response.status}`);

      let html = response.data;

      if (typeof html !== 'string' || html.length === 0) {
        console.error('🔌 Empty response received');
        return res.status(500).send('Empty response from target server');
      }

      const finalUrl = response.request?.res?.responseUrl || url;
      const urlObj = new URL(finalUrl);
      const baseUrl = urlObj.origin;

      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head><base href="${baseUrl}/">`);
      } else {
        html = `<base href="${baseUrl}/">` + html;
      }

      const inspectorScript = `
        <style>
          /* Styl podświetlenia */
          .cf-hover {
            outline: 2px solid #2563eb !important; /* Niebieska ramka */
            cursor: crosshair !important;
            background-color: rgba(37, 99, 235, 0.1) !important;
          }
        </style>
        <script>
          document.addEventListener('DOMContentLoaded', () => {
            console.log('🕵️ ContentFlow Inspector Loaded');
            
            let lastElement = null;

            // 1. Podświetlanie (Hover)
            document.body.addEventListener('mouseover', (e) => {
              e.stopPropagation();
              if (lastElement) lastElement.classList.remove('cf-hover');
              e.target.classList.add('cf-hover');
              lastElement = e.target;
            });

            document.body.addEventListener('mouseout', (e) => {
              e.target.classList.remove('cf-hover');
            });

            // 2. Klikanie (Selection)
            document.body.addEventListener('click', (e) => {
              e.preventDefault(); // Nie otwieraj linków!
              e.stopPropagation();

              const el = e.target;
              
              // Zbieramy dane o elemencie
              const data = {
                tagName: el.tagName.toLowerCase(),
                className: el.className,
                id: el.id,
                text: el.innerText.substring(0, 100), // Pierwsze 100 znaków
                src: el.src || null,
                href: el.href || null
              };

              // Wysyłamy wiadomość do rodzica (Twojego Dashboardu)
              window.parent.postMessage({ type: 'CF_ELEMENT_CLICK', payload: data }, '*');
            });
          });
        </script>
      `;

       if (html.includes('</body>')) {
        html = html.replace('</body>', inspectorScript + '</body>');
      } else {
        html += inspectorScript;
      }

      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);

    } catch (error) {
      console.error('Proxy error:', error.message);
      res.status(502).send(`Cannot load page: ${error.message}`);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadCsv(
    @UploadedFile() file: Express.Multer.File,
    @Body('projectName') projectName: string
  ) {
    return this.projectsService.importCsv(file.buffer, file.originalname, projectName);
  }

  @Post(':id/analyze')
  analyzeProject(@Param('id') id: string) {
    return this.projectsService.analyzeProject(id);
  }

  
}
