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
          /* Styl podświetlenia (Hover) - to już było */
          .cf-hover {
            outline: 2px solid #2563eb !important;
            cursor: crosshair !important;
            background-color: rgba(37, 99, 235, 0.1) !important;
            z-index: 9999;
          }

          /* --- NOWE STYLE DLA ZAPISANYCH WZORCÓW --- */
          
          /* Layout (Żółty) */
          .cf-layout-marked {
            outline: 3px dashed #eab308 !important; /* Amber-500 */
            position: relative;
          }
          .cf-layout-marked::after {
            content: "LAYOUT";
            position: absolute;
            top: 0; left: 0;
            background: #eab308;
            color: black;
            font-size: 10px;
            padding: 2px 4px;
            font-weight: bold;
            z-index: 10000;
            pointer-events: none;
          }

          /* Component (Zielony) */
          .cf-component-marked {
            outline: 3px solid #16a34a !important; /* Green-600 */
            position: relative;
          }
          /* Używamy atrybutu data-cf-label do wyświetlenia typu */
          .cf-component-marked::after {
            content: attr(data-cf-label);
            position: absolute;
            top: 0; right: 0;
            background: #16a34a;
            color: white;
            font-size: 10px;
            padding: 2px 4px;
            font-weight: bold;
            z-index: 10000;
            pointer-events: none;
          }
        </style>

        <script>
          document.addEventListener('DOMContentLoaded', () => {
            console.log('🕵️ ContentFlow Inspector Loaded');
            
            // --- 1. INTERAKCJA (Hover/Click) ---
            let lastElement = null;

            document.body.addEventListener('mouseover', (e) => {
              e.stopPropagation();
              if (lastElement) lastElement.classList.remove('cf-hover');
              e.target.classList.add('cf-hover');
              lastElement = e.target;
            });

            document.body.addEventListener('mouseout', (e) => {
              e.target.classList.remove('cf-hover');
            });

            document.body.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              const el = e.target;
              
              // Pobieramy klasy bez naszych technicznych klas cf-*
              const cleanClass = Array.from(el.classList)
                .filter(c => !c.startsWith('cf-'))
                .join(' ');

              const data = {
                tagName: el.tagName.toLowerCase(),
                className: cleanClass,
                id: el.id,
                text: el.innerText.substring(0, 100),
              };
              window.parent.postMessage({ type: 'CF_ELEMENT_CLICK', payload: data }, '*');
            });

            // --- 2. ODBIERANIE WZORCÓW (NOWOŚĆ) ---
            window.addEventListener('message', (event) => {
              if (event.data && event.data.type === 'CF_UPDATE_OVERLAYS') {
                const patterns = event.data.payload;
                console.log('🎨 Applying patterns:', patterns);

                // Czyścimy stare oznaczenia
                document.querySelectorAll('.cf-layout-marked, .cf-component-marked').forEach(el => {
                  el.classList.remove('cf-layout-marked', 'cf-component-marked');
                  el.removeAttribute('data-cf-label');
                });

                // Aplikujemy nowe
                patterns.forEach(p => {
                  try {
                    // Uwaga: Selektor musi być poprawny. Jeśli jest zbyt prosty, może zaznaczyć za dużo.
                    const elements = document.querySelectorAll(p.selector);
                    elements.forEach(el => {
                      if (p.isLayout) {
                        el.classList.add('cf-layout-marked');
                      } else {
                        el.classList.add('cf-component-marked');
                        el.setAttribute('data-cf-label', p.componentType);
                      }
                    });
                  } catch (err) {
                    console.warn('Invalid selector:', p.selector);
                  }
                });
              }
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

  // POST /projects/:id/rules - Save rules
  @Post(':id/rules')
  saveRule(
    @Param('id') id: string,
    @Body() body: { 
      name: string; 
      selector: string; 
      ruleType: 'GLOBAL' | 'CONTAINER' | 'COMPONENT';
      definitions?: any;
      contentType?: string;
      attribute?: string;
    }
  ) {
    return this.projectsService.saveRule(id, body);
  }

  // GET /projects/:id/rules - Get all rules
  @Get(':id/rules')
  getRules(@Param('id') id: string) {
    return this.projectsService.getProjectRules(id);
  }

  @Post(':id/patterns')
  savePattern(
    @Param('id') id: string,
    @Body() body: { 
      selector: string; 
      isLayout: boolean; 
      componentType?: any;
    }
  ) {
    return this.projectsService.savePattern(id, body);
  }

  // GET /projects/:id/patterns - Pobierz listę
  @Get(':id/patterns')
  getPatterns(@Param('id') id: string) {
    return this.projectsService.getPatterns(id);
  }
  
}
