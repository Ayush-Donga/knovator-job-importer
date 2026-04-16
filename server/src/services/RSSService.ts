import axios from 'axios';
import xml2js from 'xml2js';
import { IJob } from '../models/Job';

export interface RawJob {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string | { _: string };
  company?: string;
  category?: string;
  location?: string;
}

export class RSSService {
  private parser: xml2js.Parser;

  constructor() {
    this.parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
  }

  async fetchAndParse(url: string): Promise<any[]> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });
      
      const xml = response.data as string;
      const result = await this.parser.parseStringPromise(xml);
      
      // RSS 2.0 standard structure
      const items = result?.rss?.channel?.item || [];
      return Array.isArray(items) ? items : [items];
    } catch (error: any) {
      console.error(`Error fetching RSS feed from ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Maps raw RSS items to our Job model format
   */
  mapToJobFormat(rawItem: any, sourceUrl: string): Partial<IJob> {
    const externalId = (typeof rawItem.guid === 'object' ? rawItem.guid._ : rawItem.guid) || rawItem.link;
    
    // Jobicy specific fields often appear in description or are standard
    // Some feeds put company name in 'dc:creator' or 'company'
    const company = rawItem['job_listing:company'] || rawItem.company || 'Unknown Company';
    const location = rawItem['job_listing:location'] || rawItem.location || 'Remote';
    const category = rawItem['job_listing:job_category'] || rawItem.category || '';
    const type = rawItem['job_listing:job_type'] || '';

    return {
      externalId,
      title: rawItem.title,
      company: company,
      url: rawItem.link,
      location: location,
      description: rawItem.description,
      category: category,
      type: type,
      pubDate: new Date(rawItem.pubDate || Date.now()),
      sourceUrl,
    };
  }
}

export default new RSSService();
