/**
 * MOTTIVME Google Maps Lead Scraper v2
 * Usa Cheerio (leve) ao invés de Playwright (pesado)
 */

import { Actor, log } from 'apify';
import { CheerioCrawler } from 'crawlee';

await Actor.init();

const input = await Actor.getInput() ?? {};
const {
    searchQueries = ['dentista São Paulo'],
    maxResults = 100,
} = input;

log.info('Iniciando Google Maps Scraper v2', { searchQueries, maxResults });

const results = [];

// Extrair emails de texto
function extractEmails(text) {
    const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return [...new Set(text.match(regex) || [])];
}

// Extrair telefones brasileiros
function extractPhones(text) {
    const regex = /(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?(?:9?\d{4}[-.\s]?\d{4})/g;
    return [...new Set(text.match(regex) || [])];
}

// Buscar via Google Search (mais leve que Maps direto)
for (const query of searchQueries) {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=100`;

    log.info(`Buscando: ${query}`);

    const crawler = new CheerioCrawler({
        maxRequestsPerCrawl: maxResults + 10,

        async requestHandler({ request, $, enqueueLinks }) {
            const url = request.url;

            if (url.includes('google.com/search')) {
                // Página de busca - extrair links de negócios
                log.info('Processando página de busca...');

                // Extrair resultados locais do Google
                const localResults = [];

                // Tentar pegar do Local Pack
                $('div[data-hveid]').each((i, el) => {
                    const $el = $(el);
                    const name = $el.find('span[role="heading"]').text() ||
                                 $el.find('.OSrXXb').text() ||
                                 $el.find('div[role="heading"]').text();

                    if (name && name.length > 2) {
                        const text = $el.text();
                        const phones = extractPhones(text);
                        const address = text.match(/(?:Rua|Av\.|Avenida|R\.)[^·]+/)?.[0]?.trim();

                        if (name) {
                            localResults.push({
                                name: name.trim(),
                                phone: phones[0] || null,
                                address: address || null,
                                query: query,
                                source: 'google_search'
                            });
                        }
                    }
                });

                // Também pegar resultados orgânicos com sites
                const siteUrls = [];
                $('a[href*="http"]').each((i, el) => {
                    const href = $(el).attr('href');
                    if (href &&
                        !href.includes('google.com') &&
                        !href.includes('youtube.com') &&
                        !href.includes('facebook.com') &&
                        (href.includes('.com.br') || href.includes('clinica') || href.includes('odonto') || href.includes('dental'))) {
                        siteUrls.push(href);
                    }
                });

                log.info(`Encontrados ${localResults.length} resultados locais, ${siteUrls.length} sites`);

                // Adicionar resultados locais
                for (const result of localResults.slice(0, maxResults)) {
                    results.push(result);
                }

                // Enfileirar sites para extrair emails
                for (const siteUrl of siteUrls.slice(0, 30)) {
                    try {
                        await crawler.addRequests([{ url: siteUrl, userData: { type: 'site', query } }]);
                    } catch (e) {
                        // URL inválida
                    }
                }

            } else {
                // Site de negócio - extrair contatos
                log.info(`Extraindo contatos de: ${url}`);

                const pageText = $('body').text() || '';
                const emails = extractEmails(pageText);
                const phones = extractPhones(pageText);

                // Tentar pegar nome da empresa
                const title = $('title').text() || '';
                const h1 = $('h1').first().text() || '';
                const name = h1 || title.split('|')[0].split('-')[0].trim();

                if (emails.length > 0 || phones.length > 0) {
                    results.push({
                        name: name.substring(0, 100),
                        website: url,
                        emails: emails.slice(0, 5),
                        phones: phones.slice(0, 3),
                        query: request.userData.query,
                        source: 'website_scrape'
                    });
                    log.info(`✅ ${name}: ${emails.length} emails, ${phones.length} telefones`);
                }
            }
        },

        failedRequestHandler({ request, error }) {
            log.warning(`Falhou: ${request.url} - ${error.message}`);
        },
    });

    await crawler.run([searchUrl]);
}

// Remover duplicatas por nome
const uniqueResults = [];
const seenNames = new Set();

for (const r of results) {
    const key = r.name?.toLowerCase().substring(0, 30);
    if (key && !seenNames.has(key)) {
        seenNames.add(key);
        uniqueResults.push(r);
    }
}

log.info(`Total: ${uniqueResults.length} leads únicos (de ${results.length} brutos)`);

await Actor.pushData(uniqueResults);
await Actor.exit();
