#!/usr/bin/env python3
"""
Populate LinkedIn Leads from CSV
================================
Import leads from CSV file or Sales Navigator export into Supabase.

Usage:
    python populate_linkedin_leads.py --file leads.csv
    python populate_linkedin_leads.py --sample  # Create sample data
"""

import os
import sys
import csv
import argparse
from pathlib import Path
from datetime import datetime

import requests
from dotenv import load_dotenv

# Load environment
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://bfumywvwubvernvhjehk.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

BASE_URL = f"{SUPABASE_URL}/rest/v1"
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}


def calculate_icp_score(lead: dict) -> tuple[int, str]:
    """Calculate ICP score (0-100) based on lead data"""
    score = 50
    
    headline = (lead.get("headline") or "").lower()
    title = (lead.get("title") or "").lower()
    combined = f"{headline} {title}"
    
    # Positive keywords
    positive_titles = ["ceo", "cto", "cfo", "cmo", "founder", "fundador", 
                       "diretor", "director", "head", "vp", "gerente"]
    for kw in positive_titles:
        if kw in combined:
            score += 15
            break
    
    positive_industries = ["saas", "software", "tech", "fintech", "marketing"]
    for kw in positive_industries:
        if kw in combined:
            score += 10
            break
    
    # Negative keywords
    negative_titles = ["estagiário", "intern", "trainee", "estudante", "freelancer"]
    for kw in negative_titles:
        if kw in combined:
            score -= 30
            break
    
    # Clamp
    score = max(0, min(100, score))
    
    # Priority
    if score >= 70:
        priority = "hot"
    elif score >= 50:
        priority = "warm"
    elif score >= 30:
        priority = "cold"
    else:
        priority = "skip"
    
    return score, priority


def import_from_csv(filepath: str) -> int:
    """Import leads from CSV file"""
    print(f"📂 Reading {filepath}...")
    
    imported = 0
    skipped = 0
    
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        # Try to detect delimiter
        sample = f.read(1024)
        f.seek(0)
        
        if '\t' in sample:
            reader = csv.DictReader(f, delimiter='\t')
        else:
            reader = csv.DictReader(f)
        
        for row in reader:
            # Map common column names
            linkedin_url = (
                row.get('linkedin_url') or 
                row.get('LinkedIn URL') or 
                row.get('Profile URL') or
                row.get('profileUrl') or
                row.get('url') or
                ''
            ).strip()
            
            if not linkedin_url or '/in/' not in linkedin_url:
                skipped += 1
                continue
            
            # Clean URL
            if '?' in linkedin_url:
                linkedin_url = linkedin_url.split('?')[0]
            
            lead = {
                'linkedin_url': linkedin_url,
                'full_name': row.get('full_name') or row.get('Name') or row.get('First Name', '') + ' ' + row.get('Last Name', ''),
                'headline': row.get('headline') or row.get('Headline') or row.get('Title'),
                'company': row.get('company') or row.get('Company') or row.get('Current Company'),
                'title': row.get('title') or row.get('Job Title') or row.get('Position'),
                'location': row.get('location') or row.get('Location'),
                'industry': row.get('industry') or row.get('Industry'),
                'source': 'csv_import'
            }
            
            # Calculate score
            score, priority = calculate_icp_score(lead)
            lead['icp_score'] = score
            lead['priority'] = priority
            
            # Clean empty strings
            lead = {k: v.strip() if isinstance(v, str) and v.strip() else (v if v else None) 
                   for k, v in lead.items()}
            
            # Extract first_name
            if lead['full_name']:
                lead['first_name'] = lead['full_name'].split()[0]
            
            # Insert
            try:
                response = requests.post(
                    f"{BASE_URL}/linkedin_leads",
                    headers=HEADERS,
                    json=lead
                )
                
                if response.status_code in [200, 201]:
                    imported += 1
                    print(f"   ✅ {lead['full_name'] or lead['linkedin_url'][:40]} (score: {score})")
                elif 'duplicate' in response.text.lower():
                    skipped += 1
                    print(f"   ⏭️ Duplicate: {lead['linkedin_url'][:40]}")
                else:
                    print(f"   ❌ Error: {response.text[:100]}")
                    
            except Exception as e:
                print(f"   ❌ Error: {e}")
    
    return imported, skipped


def create_sample_data():
    """Create sample lead data for testing"""
    print("📝 Creating sample leads...")
    
    sample_leads = [
        {
            "linkedin_url": "https://linkedin.com/in/sample-ceo-1",
            "full_name": "Carlos Santos",
            "first_name": "Carlos",
            "headline": "CEO at TechStartup Brasil | SaaS | B2B",
            "company": "TechStartup Brasil",
            "title": "CEO",
            "industry": "Software",
            "source": "sample"
        },
        {
            "linkedin_url": "https://linkedin.com/in/sample-director-2",
            "full_name": "Maria Oliveira",
            "first_name": "Maria",
            "headline": "Diretora de Marketing at GrowthCo",
            "company": "GrowthCo",
            "title": "Diretora de Marketing",
            "industry": "Marketing",
            "source": "sample"
        },
        {
            "linkedin_url": "https://linkedin.com/in/sample-vp-3",
            "full_name": "Pedro Almeida",
            "first_name": "Pedro",
            "headline": "VP Sales at Empresa XYZ | Fintech",
            "company": "Empresa XYZ",
            "title": "VP Sales",
            "industry": "Fintech",
            "source": "sample"
        },
        {
            "linkedin_url": "https://linkedin.com/in/sample-founder-4",
            "full_name": "Ana Costa",
            "first_name": "Ana",
            "headline": "Founder & CEO at StartupABC | Healthtech",
            "company": "StartupABC",
            "title": "Founder & CEO",
            "industry": "Healthtech",
            "source": "sample"
        },
        {
            "linkedin_url": "https://linkedin.com/in/sample-gerente-5",
            "full_name": "Lucas Silva",
            "first_name": "Lucas",
            "headline": "Gerente de Vendas at Consultoria 123",
            "company": "Consultoria 123",
            "title": "Gerente de Vendas",
            "industry": "Consulting",
            "source": "sample"
        }
    ]
    
    imported = 0
    for lead in sample_leads:
        # Calculate score
        score, priority = calculate_icp_score(lead)
        lead['icp_score'] = score
        lead['priority'] = priority
        
        try:
            response = requests.post(
                f"{BASE_URL}/linkedin_leads",
                headers=HEADERS,
                json=lead
            )
            
            if response.status_code in [200, 201]:
                imported += 1
                print(f"   ✅ {lead['full_name']} (score: {score}, {priority})")
            else:
                print(f"   ⚠️ {lead['full_name']}: {response.text[:50]}")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    return imported


def main():
    parser = argparse.ArgumentParser(description='Populate LinkedIn leads')
    parser.add_argument('--file', '-f', type=str, help='CSV file path')
    parser.add_argument('--sample', '-s', action='store_true', help='Create sample data')
    args = parser.parse_args()
    
    if not SUPABASE_KEY:
        print("❌ Set SUPABASE_SERVICE_ROLE_KEY in .env")
        sys.exit(1)
    
    if args.sample:
        imported = create_sample_data()
        print(f"\n✅ Created {imported} sample leads")
        
    elif args.file:
        if not Path(args.file).exists():
            print(f"❌ File not found: {args.file}")
            sys.exit(1)
        
        imported, skipped = import_from_csv(args.file)
        print(f"\n✅ Imported: {imported} | Skipped: {skipped}")
        
    else:
        print("Usage:")
        print("  python populate_linkedin_leads.py --file leads.csv")
        print("  python populate_linkedin_leads.py --sample")


if __name__ == "__main__":
    main()
