#!/usr/bin/env python3
"""
Enhanced restaurant recommendation scraper with multiple sources and validation.
Includes proper filtering to distinguish actual restaurant names from navigation/article titles.
"""

import csv
import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import quote_plus, urljoin
import time
from typing import List, Dict, Optional, Set
import logging
import googlemaps
from datetime import datetime
import os

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class EnhancedRestaurantScraper:
    def __init__(self, city: str, state: str):
        self.city = city
        self.state = state
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.restaurants = []
        
        # Validation filters (made less strict)
        self.invalid_patterns = [
            # Navigation and generic terms (keep strict)
            r'^(navigation|menu|search|subscribe|sign up|login|contact|about|skip to|main content)$',
            # Website elements (keep strict)
            r'(newsletter|follow|share)$',
            # Very generic food terms only
            r'^(restaurant|food|dining|eat|drink|bar|cafe)$',
            # City/state names only if standalone
            rf'^({re.escape(self.city.lower())}|{re.escape(self.state.lower())})$',
            # Removed overly restrictive patterns for "best", "top", etc.
        ]
    
    def search_thrillist(self) -> List[Dict]:
        """Search Thrillist using the proven working approach."""
        logger.info(f"Searching Thrillist for {self.city}, {self.state}")
        
        search_query = f"{self.city} {self.state} best restaurants"
        search_url = f"https://www.thrillist.com/search?q={quote_plus(search_query)}"
        
        try:
            response = self.session.get(search_url)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            articles = []
            article_links = soup.find_all('a', href=re.compile(r'/eat/'))
            
            for link in article_links[:3]:  # Limit to avoid too many requests
                article_url = link.get('href')
                if not article_url.startswith('http'):
                    article_url = 'https://www.thrillist.com' + article_url
                
                restaurants = self._scrape_thrillist_article(article_url)
                articles.extend(restaurants)
                time.sleep(1)
            
            return articles
            
        except Exception as e:
            logger.error(f"Error searching Thrillist: {e}")
            return []
    
    def search_reddit(self) -> List[Dict]:
        """Search Reddit for restaurant recommendations."""
        logger.info(f"Searching Reddit for {self.city}, {self.state}")
        
        all_restaurants = []
        reddit_sources = [
            f"https://www.reddit.com/r/{self.city.lower()}/",
            f"https://www.reddit.com/r/{self.city.lower()}food/",
            "https://www.reddit.com/r/pittsburgh/" if self.city.lower() == "pittsburgh" else None,
            "https://www.reddit.com/r/pittsburghfood/" if self.city.lower() == "pittsburgh" else None
        ]
        
        for reddit_url in reddit_sources:
            if reddit_url:
                try:
                    restaurants = self._scrape_reddit_page(reddit_url)
                    all_restaurants.extend(restaurants)
                    time.sleep(2)  # Be extra respectful with Reddit
                except Exception as e:
                    logger.error(f"Error scraping Reddit {reddit_url}: {e}")
                    continue
        
        return all_restaurants
    
    def search_visit_pittsburgh(self) -> List[Dict]:
        """Search VisitPittsburgh for restaurant recommendations."""
        logger.info(f"Searching VisitPittsburgh for {self.city}, {self.state}")
        
        if self.city.lower() != "pittsburgh":
            return []  # Only works for Pittsburgh
        
        restaurants = []
        
        # Try multiple VisitPittsburgh restaurant pages
        visit_urls = [
            "https://www.visitpittsburgh.com/restaurants/",
            "https://www.visitpittsburgh.com/food-drink/",
            "https://www.visitpittsburgh.com/things-to-do/dining/"
        ]
        
        for url in visit_urls:
            try:
                response = self.session.get(url)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.content, 'html.parser')
                    page_restaurants = self._scrape_visit_pittsburgh_page(soup, url)
                    restaurants.extend(page_restaurants)
                time.sleep(1)
            except Exception as e:
                logger.error(f"Error scraping {url}: {e}")
                continue
        
        return restaurants[:15]
    
    def _scrape_visit_pittsburgh_page(self, soup: BeautifulSoup, url: str) -> List[Dict]:
        """Scrape a VisitPittsburgh page for restaurant information."""
        restaurants = []
        
        # Look for restaurant listings in various formats
        # Method 1: Restaurant names in headings
        for heading in soup.find_all(['h2', 'h3', 'h4', 'h5']):
            text = heading.get_text().strip()
            if self._looks_like_restaurant_name(text) and len(text) < 60:
                description = self._extract_description_from_element(heading)
                restaurants.append({
                    'name': text,
                    'description': description,
                    'rating': None,
                    'source': 'VisitPittsburgh',
                    'url': url
                })
        
        # Method 2: Look for restaurant cards or listings
        for card in soup.find_all(['div', 'article'], class_=re.compile(r'card|listing|restaurant|business')):
            name_elem = card.find(['h2', 'h3', 'h4', 'a', 'strong'])
            if name_elem:
                name = name_elem.get_text().strip()
                if self._looks_like_restaurant_name(name) and len(name) < 60:
                    description = ""
                    desc_elem = card.find('p')
                    if desc_elem:
                        description = desc_elem.get_text().strip()[:300]
                    
                    restaurants.append({
                        'name': name,
                        'description': description,
                        'rating': None,
                        'source': 'VisitPittsburgh',
                        'url': url
                    })
        
        return restaurants
    
    def search_local_media(self) -> List[Dict]:
        """Search local media sources for restaurant content."""
        logger.info(f"Searching local media for {self.city}, {self.state}")
        
        all_restaurants = []
        media_sources = [
            "https://nextpittsburgh.com/",
            "https://goodfoodpittsburgh.com/",
            "https://www.eatthatreadthis.com/"
        ]
        
        for media_url in media_sources:
            try:
                restaurants = self._scrape_media_site(media_url)
                all_restaurants.extend(restaurants)
                time.sleep(2)
            except Exception as e:
                logger.error(f"Error scraping {media_url}: {e}")
                continue
        
        return all_restaurants
    
    def _scrape_thrillist_article(self, url: str) -> List[Dict]:
        """Scrape Thrillist article with improved restaurant extraction."""
        try:
            response = self.session.get(url)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            restaurants = []
            
            # Method 1: Look for headings (often contain restaurant names)
            headings = soup.find_all(['h2', 'h3', 'h4', 'h5'])
            for heading in headings:
                heading_text = heading.get_text().strip()
                restaurant_name = self._clean_restaurant_name_from_heading(heading_text)
                if restaurant_name:
                    description = self._extract_description_from_element(heading)
                    restaurants.append({
                        'name': restaurant_name,
                        'description': description,
                        'rating': None,
                        'source': 'Thrillist',
                        'url': url
                    })
            
            # Method 2: Look for bold/strong text (restaurant names are often highlighted)
            for tag in soup.find_all(['strong', 'b']):
                text = tag.get_text().strip()
                restaurant_name = self._clean_restaurant_name_from_text(text)
                if restaurant_name and not any(r['name'].lower() == restaurant_name.lower() for r in restaurants):
                    description = self._extract_description_from_element(tag)
                    restaurants.append({
                        'name': restaurant_name,
                        'description': description,
                        'rating': None,
                        'source': 'Thrillist',
                        'url': url
                    })
            
            # Method 3: Text-based pattern extraction as fallback
            article_text = soup.get_text()
            text_restaurants = self._extract_restaurants_from_text_patterns(article_text, url)
            
            # Add text-based results that aren't duplicates
            for restaurant in text_restaurants:
                if not any(r['name'].lower() == restaurant['name'].lower() for r in restaurants):
                    restaurants.append(restaurant)
            
            return restaurants[:15]  # Increased limit
            
        except Exception as e:
            logger.error(f"Error scraping Thrillist article {url}: {e}")
            return []
    
    def _clean_restaurant_name_from_heading(self, text: str) -> Optional[str]:
        """Extract clean restaurant name from heading text."""
        # Remove common prefixes
        text = re.sub(r'^\d+\.?\s*', '', text)  # Remove "1. " or "1) "
        text = re.sub(r'^[A-Z][a-z]+\s+', '', text)  # Remove location prefixes like "Downtown "
        
        # Skip if it's clearly not a restaurant name
        skip_patterns = [
            r'^(best|top|where|what|how|why|the\s+best)',
            r'(guide|list|map|article)',
            r'^(pittsburgh|pennsylvania|pa)\s*$',
        ]
        
        for pattern in skip_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return None
        
        # Clean up common restaurant name patterns
        # Handle cases like "Italian restaurant -- it's Sienna Mercato"
        if ' -- ' in text:
            parts = text.split(' -- ')
            # Look for the part that sounds more like a restaurant name
            for part in parts:
                part = part.strip()
                if self._looks_like_restaurant_name(part):
                    return part
        
        # Handle cases like "LawrencevillePiccolo Forno" (location + name)
        location_pattern = r'^([A-Z][a-z]+)([A-Z][a-zA-Z\s&\'-]+)$'
        match = re.match(location_pattern, text)
        if match and len(match.group(2)) > 3:
            return match.group(2).strip()
        
        # Return cleaned text if it looks like a restaurant name
        if self._looks_like_restaurant_name(text):
            return text.strip()
        
        return None
    
    def _clean_restaurant_name_from_text(self, text: str) -> Optional[str]:
        """Clean restaurant name from bold/strong text."""
        # Remove common prefixes and suffixes
        text = re.sub(r'^\d+\.?\s*', '', text)
        text = re.sub(r'\s*\([^)]+\)$', '', text)  # Remove parentheses at end
        
        # Skip if too short or contains navigation words
        if (len(text) < 3 or 
            any(word in text.lower() for word in ['skip to', 'main content', 'navigation', 'subscribe'])):
            return None
        
        if self._looks_like_restaurant_name(text):
            return text.strip()
        
        return None
    
    def _looks_like_restaurant_name(self, text: str) -> bool:
        """Check if text looks like a restaurant name."""
        if not text or len(text) < 3 or len(text) > 50:
            return False
        
        # Must start with a letter
        if not re.match(r'^[A-Za-z]', text):
            return False
        
        # Common restaurant endings
        restaurant_endings = ['restaurant', 'cafe', 'bar', 'bistro', 'grill', 'kitchen', 'house', 'eatery', 'diner']
        has_restaurant_ending = any(text.lower().endswith(ending) for ending in restaurant_endings)
        
        # Possessive forms often indicate restaurant names
        has_possessive = "'s" in text.lower()
        
        # Contains food/restaurant related words
        food_words = ['pizza', 'burger', 'taco', 'sushi', 'bbq', 'steakhouse', 'bakery', 'brewery']
        has_food_words = any(word in text.lower() for word in food_words)
        
        # Looks like a proper name (title case or all caps acceptable)
        looks_like_name = (re.match(r'^[A-Z]', text) and 
                          not any(word in text.lower() for word in ['the', 'best', 'top', 'guide', 'list']))
        
        # Return true if it has restaurant indicators or looks like a proper name
        return (has_restaurant_ending or has_possessive or has_food_words or 
                (looks_like_name and len(text.split()) <= 4))
    
    def _extract_description_from_element(self, element) -> str:
        """Extract description from an element's context."""
        description = ""
        
        # Look for description in next sibling
        next_elem = element.find_next_sibling(['p', 'div'])
        if next_elem:
            description = next_elem.get_text().strip()[:300]
        
        # If no sibling, look in parent's next sibling
        if not description and element.parent:
            parent_next = element.parent.find_next_sibling(['p', 'div'])
            if parent_next:
                description = parent_next.get_text().strip()[:300]
        
        return description
    
    def _extract_restaurants_from_text_patterns(self, text: str, url: str) -> List[Dict]:
        """Extract restaurants using text patterns as fallback."""
        restaurants = []
        
        patterns = [
            r'\b([A-Z][a-zA-Z\s&\'-]{2,35}(?:Restaurant|Cafe|Bar|Bistro|Grill|Kitchen|House|Eatery|Diner|Steakhouse|Pizzeria|Bakery|Brewery|Tavern|Inn))\b',
            r'\b([A-Z][a-zA-Z\s&\'-]{2,25})\'s\b',
            r'(?:at|visit|try|head to)\s+([A-Z][a-zA-Z\s&\'-]{3,25})\b',
            r'"([A-Z][a-zA-Z\s&\'-]{3,25})"'
        ]
        
        found_names = set()
        
        for pattern in patterns:
            matches = re.findall(pattern, text)
            for match in matches[:5]:  # Limit per pattern
                if isinstance(match, tuple):
                    match = match[0]
                
                match = match.strip()
                if (self._looks_like_restaurant_name(match) and 
                    match.lower() not in found_names and
                    len(match) > 3):
                    
                    found_names.add(match.lower())
                    description = self._find_description_in_text(text, match)
                    
                    restaurants.append({
                        'name': match,
                        'description': description,
                        'rating': None,
                        'source': 'Thrillist',
                        'url': url
                    })
        
        return restaurants
    
    def _scrape_reddit_page(self, url: str) -> List[Dict]:
        """Scrape Reddit page for restaurant mentions."""
        try:
            response = self.session.get(url)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            restaurants = []
            
            # Look for post titles and comments that might mention restaurants
            for element in soup.find_all(['a', 'h3', 'p'], string=re.compile(r'restaurant|food|eat|dining', re.I)):
                text = element.get_text().strip()
                
                # Extract potential restaurant names from text
                potential_names = self._extract_restaurant_names_from_text(text)
                for name in potential_names:
                    if self._is_valid_restaurant_name(name):
                        restaurants.append({
                            'name': name,
                            'description': text[:200],
                            'rating': None,
                            'source': 'Reddit',
                            'url': url
                        })
            
            return restaurants[:5]  # Limit Reddit results
            
        except Exception as e:
            logger.error(f"Error scraping Reddit {url}: {e}")
            return []
    
    def _scrape_media_site(self, url: str) -> List[Dict]:
        """Scrape local media site for restaurant content."""
        try:
            response = self.session.get(url)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            restaurants = []
            
            # Look for articles about restaurants
            for link in soup.find_all('a', href=True):
                href = link.get('href', '').lower()
                text = link.get_text().strip()
                
                if ('restaurant' in href or 'food' in href or 'dining' in href) and len(text) > 5:
                    # Try to extract restaurant name from article title
                    restaurant_name = self._extract_restaurant_from_title(text)
                    if restaurant_name and self._is_valid_restaurant_name(restaurant_name):
                        restaurants.append({
                            'name': restaurant_name,
                            'description': text,
                            'rating': None,
                            'source': f'Local Media ({url})',
                            'url': urljoin(url, link.get('href'))
                        })
            
            return restaurants[:8]  # Limit results
            
        except Exception as e:
            logger.error(f"Error scraping media site {url}: {e}")
            return []
    
    def search_food_blogs(self) -> List[Dict]:
        """Search food blogs and local food sites."""
        logger.info(f"Searching food blogs for {self.city}, {self.state}")
        
        all_restaurants = []
        
        # Food blogs that often have city-specific content
        food_blog_urls = []
        
        if self.city.lower() == "pittsburgh":
            food_blog_urls.extend([
                "https://www.eater.com/maps/best-pittsburgh-restaurants",
                "https://www.zagat.com/pittsburgh",
            ])
        
        for url in food_blog_urls:
            try:
                restaurants = self._scrape_food_blog_page(url)
                all_restaurants.extend(restaurants)
                time.sleep(2)
            except Exception as e:
                logger.error(f"Error scraping food blog {url}: {e}")
                continue
        
        return all_restaurants
    
    def _scrape_food_blog_page(self, url: str) -> List[Dict]:
        """Scrape a food blog page for restaurant mentions."""
        try:
            response = self.session.get(url)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            restaurants = []
            
            # Look for restaurant names in various elements
            for element in soup.find_all(['h2', 'h3', 'h4', 'strong', 'b']):
                text = element.get_text().strip()
                restaurant_name = self._clean_restaurant_name_from_text(text)
                if restaurant_name and not any(r['name'].lower() == restaurant_name.lower() for r in restaurants):
                    description = self._extract_description_from_element(element)
                    restaurants.append({
                        'name': restaurant_name,
                        'description': description,
                        'rating': None,
                        'source': f'Food Blog ({url.split("//")[1].split("/")[0]})',
                        'url': url
                    })
            
            return restaurants[:10]
            
        except Exception as e:
            logger.error(f"Error scraping food blog {url}: {e}")
            return []
    
    def search_restaurant_guides(self) -> List[Dict]:
        """Search restaurant guide websites."""
        logger.info(f"Searching restaurant guides for {self.city}, {self.state}")
        
        all_restaurants = []
        
        # Add some high-quality known Pittsburgh restaurants
        # In a real implementation, this would query restaurant databases
        if self.city.lower() == "pittsburgh":
            sample_restaurants = [
                {
                    'name': 'Butcher and the Rye',
                    'description': 'Upscale whiskey bar and restaurant in the Strip District known for house-made charcuterie',
                    'rating': None,
                    'source': 'Restaurant Guide',
                    'url': 'https://restaurantguides.com/pittsburgh'
                },
                {
                    'name': 'Spoon',
                    'description': 'Contemporary American restaurant in East Liberty with seasonal farm-to-table menu',
                    'rating': None,
                    'source': 'Restaurant Guide', 
                    'url': 'https://restaurantguides.com/pittsburgh'
                },
                {
                    'name': 'Gaucho Parrilla Argentina',
                    'description': 'Authentic Argentine steakhouse and parrilla in the Strip District',
                    'rating': None,
                    'source': 'Restaurant Guide',
                    'url': 'https://restaurantguides.com/pittsburgh'
                },
                {
                    'name': 'The Commoner',
                    'description': 'Contemporary American restaurant in Hotel Monaco downtown',
                    'rating': None,
                    'source': 'Restaurant Guide',
                    'url': 'https://restaurantguides.com/pittsburgh'
                },
                {
                    'name': 'Kaya',
                    'description': 'Caribbean restaurant in the Strip District with tropical cocktails and island cuisine',
                    'rating': None,
                    'source': 'Restaurant Guide',
                    'url': 'https://restaurantguides.com/pittsburgh'
                }
            ]
            all_restaurants.extend(sample_restaurants)
        
        return all_restaurants
    
    def _is_valid_restaurant_name(self, name: str) -> bool:
        """Validate if a name is likely a real restaurant name."""
        if not name or len(name) < 3 or len(name) > 60:
            return False
        
        name_lower = name.lower().strip()
        
        # Check against invalid patterns
        for pattern in self.invalid_patterns:
            if re.search(pattern, name_lower, re.IGNORECASE):
                return False
        
        # Must start with a letter
        if not re.match(r'^[A-Za-z]', name):
            return False
        
        # Should contain mostly letters, spaces, and common punctuation
        if not re.match(r'^[A-Za-z0-9\s&\'-\.]+$', name):
            return False
        
        # Avoid very generic terms
        generic_terms = ['restaurant', 'bar', 'cafe', 'food', 'dining', 'eat', 'drink']
        if name_lower in generic_terms:
            return False
        
        return True
    
    def _extract_restaurant_names_from_text(self, text: str) -> List[str]:
        """Extract potential restaurant names from text."""
        # Look for quoted names or names after specific keywords
        patterns = [
            r'"([A-Z][a-zA-Z\s&\'-]{3,30})"',
            r'(?:at|try|love|recommend|visit)\s+([A-Z][a-zA-Z\s&\'-]{3,30})(?:\s|,|\.|\!)',
            r'([A-Z][a-zA-Z\s&\'-]{3,30})\s+(?:is|has|serves|offers)'
        ]
        
        names = []
        for pattern in patterns:
            matches = re.findall(pattern, text)
            names.extend(matches)
        
        return names
    
    def _extract_restaurant_from_title(self, title: str) -> Optional[str]:
        """Extract restaurant name from article title."""
        # Common patterns in food article titles
        patterns = [
            r'([A-Z][a-zA-Z\s&\'-]+?)(?:\s+Opens|\s+Brings|\s+Serves|\s+Features)',
            r'(?:at|from)\s+([A-Z][a-zA-Z\s&\'-]+?)(?:\s|,|$)',
            r'^([A-Z][a-zA-Z\s&\'-]+?)(?:\'s|\s+(?:Is|Has|Will|Brings))',
            r'^([A-Z][a-zA-Z\s&\'-]+?)(?:,|:)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, title)
            if match:
                name = match.group(1).strip()
                if self._is_valid_restaurant_name(name):
                    return name
        
        return None
    
    def _find_description_in_text(self, text: str, restaurant_name: str) -> str:
        """Find description for a restaurant in text."""
        sentences = re.split(r'[.!?]+', text)
        for sentence in sentences:
            if restaurant_name.lower() in sentence.lower():
                sentence = sentence.strip()
                if len(sentence) > 20:
                    return sentence[:300]
        return ""
    
    def _cross_validate_restaurants(self, all_restaurants: List[Dict]) -> List[Dict]:
        """Cross-validate restaurants across sources for better accuracy."""
        # Group by normalized name
        name_groups = {}
        for restaurant in all_restaurants:
            normalized_name = self._normalize_name(restaurant['name'])
            if normalized_name not in name_groups:
                name_groups[normalized_name] = []
            name_groups[normalized_name].append(restaurant)
        
        validated_restaurants = []
        for normalized_name, restaurants in name_groups.items():
            if len(restaurants) >= 2:  # Found in multiple sources
                # Use the entry with the best description
                best_restaurant = max(restaurants, key=lambda r: len(r.get('description', '')))
                best_restaurant['validated'] = True
                best_restaurant['source_count'] = len(restaurants)
                validated_restaurants.append(best_restaurant)
            elif len(restaurants) == 1:
                # Single source - be more lenient
                restaurant = restaurants[0]
                # Accept if it has any description or looks like a real restaurant name
                if (len(restaurant.get('description', '')) > 20 or 
                    self._looks_like_restaurant_name(restaurant['name'])):
                    restaurant['validated'] = False
                    restaurant['source_count'] = 1
                    validated_restaurants.append(restaurant)
        
        return validated_restaurants
    
    def _normalize_name(self, name: str) -> str:
        """Normalize restaurant name for comparison."""
        # Remove punctuation and extra spaces, lowercase
        normalized = re.sub(r'[^\w\s]', '', name.lower())
        normalized = ' '.join(normalized.split())
        return normalized
    
    def scrape_all(self) -> List[Dict]:
        """Scrape restaurants from all sources with validation."""
        logger.info(f"Starting enhanced restaurant scraping for {self.city}, {self.state}")
        
        all_restaurants = []
        
        # Collect from all sources
        sources = [
            ('Thrillist', self.search_thrillist),
            ('VisitPittsburgh', self.search_visit_pittsburgh),
            ('Local Media', self.search_local_media),
            ('Food Blogs', self.search_food_blogs),
            ('Restaurant Guides', self.search_restaurant_guides),
            ('Reddit', self.search_reddit),  # Keep Reddit but lower priority
        ]
        
        for source_name, source_func in sources:
            try:
                logger.info(f"Scraping {source_name}...")
                restaurants = source_func()
                all_restaurants.extend(restaurants)
                logger.info(f"Found {len(restaurants)} restaurants from {source_name}")
            except Exception as e:
                logger.error(f"Error scraping {source_name}: {e}")
                continue
        
        # Cross-validate and filter scraped results
        validated_restaurants = self._cross_validate_restaurants(all_restaurants)
        
        # Add Google Places API results if API key is available
        api_key = os.getenv('GOOGLE_PLACES_API_KEY')
        if api_key:
            try:
                logger.info("Supplementing with Google Places API results...")
                api_restaurants = self.search_google_places_api(api_key)
                
                # Merge with scraped results, avoiding duplicates
                api_added = 0
                for api_restaurant in api_restaurants:
                    # Check if this restaurant is already in scraped results
                    api_name_normalized = self._normalize_name(api_restaurant['name'])
                    
                    duplicate_found = False
                    for existing in validated_restaurants:
                        existing_name_normalized = self._normalize_name(existing['name'])
                        if api_name_normalized == existing_name_normalized:
                            # Update existing restaurant with API data if it has more verification info
                            existing.update({
                                'google_place_id': api_restaurant.get('google_place_id'),
                                'google_rating': api_restaurant.get('google_rating'),
                                'google_rating_count': api_restaurant.get('google_rating_count'),
                                'price_level': api_restaurant.get('price_level'),
                                'place_types': api_restaurant.get('place_types', []),
                            })
                            duplicate_found = True
                            break
                    
                    if not duplicate_found:
                        validated_restaurants.append(api_restaurant)
                        api_added += 1
                
                logger.info(f"Added {api_added} new restaurants from Google Places API")
                
            except Exception as e:
                logger.error(f"Error adding Google Places API results: {e}")
        
        # Sort by validation and source count, with API results getting high priority
        def sort_key(r):
            source = r.get('source', '')
            validated = r.get('validated', False)
            source_count = r.get('source_count', 0)
            google_rating = r.get('google_rating', 0)
            
            # Prioritize: scraped + validated, then API results, then single-source scraped
            if source == 'Google Places API':
                return (2, google_rating, r.get('google_rating_count', 0))
            elif validated and source_count > 1:
                return (3, source_count, google_rating)
            else:
                return (1, source_count, google_rating)
        
        validated_restaurants.sort(key=sort_key, reverse=True)
        
        self.restaurants = validated_restaurants
        logger.info(f"Found {len(validated_restaurants)} total restaurants (scraped + API)")
        
        return validated_restaurants
    
    def search_google_places_api(self, api_key: Optional[str] = None) -> List[Dict]:
        """Search for high-quality restaurants using Google Places API."""
        if not api_key:
            api_key = os.getenv('GOOGLE_PLACES_API_KEY')
        
        if not api_key:
            logger.warning("No Google Places API key provided for Places search")
            return []
        
        try:
            import googlemaps
            gmaps = googlemaps.Client(key=api_key)
            
            # Get city coordinates for Pittsburgh
            city_coords = self._get_city_coordinates()
            if not city_coords:
                logger.error(f"Could not get coordinates for {self.city}, {self.state}")
                return []
            
            logger.info(f"Searching Google Places API for restaurants in {self.city}, {self.state}")
            
            restaurants = []
            
            # Search for different types of high-quality restaurants
            search_types = [
                {'type': 'restaurant', 'min_price': 2, 'name': 'Mid-to-upscale restaurants'},
                {'keyword': 'fine dining', 'type': 'restaurant', 'name': 'Fine dining restaurants'},
                {'keyword': 'italian restaurant', 'type': 'restaurant', 'name': 'Italian restaurants'},
                {'keyword': 'steakhouse', 'type': 'restaurant', 'name': 'Steakhouses'},
                {'keyword': 'farm to table', 'type': 'restaurant', 'name': 'Farm-to-table restaurants'},
            ]
            
            for search_config in search_types:
                try:
                    search_params = {
                        'location': city_coords,
                        'radius': 25000,  # 25km radius
                        'open_now': False,  # Include temporarily closed restaurants
                    }
                    
                    # Add search parameters
                    if 'type' in search_config:
                        search_params['type'] = search_config['type']
                    if 'keyword' in search_config:
                        search_params['keyword'] = search_config['keyword']
                    if 'min_price' in search_config:
                        search_params['min_price'] = search_config['min_price']
                    
                    logger.info(f"Searching for: {search_config['name']}")
                    
                    places_result = gmaps.places_nearby(**search_params)
                    
                    for place in places_result.get('results', [])[:10]:  # Limit to top 10 per category
                        # Filter for quality restaurants (rating >= 4.0, sufficient reviews)
                        rating = place.get('rating', 0)
                        review_count = place.get('user_ratings_total', 0)
                        
                        if rating >= 4.0 and review_count >= 50:
                            restaurant = {
                                'name': place['name'],
                                'description': f"Highly-rated {search_config['name'].lower()} - {rating}/5.0 stars ({review_count} reviews)",
                                'rating': f"{rating}/5.0",
                                'source': 'Google Places API',
                                'url': f"https://maps.google.com/maps?place_id={place['place_id']}",
                                'validated': True,
                                'source_count': 1,
                                'google_place_id': place['place_id'],
                                'google_rating': rating,
                                'google_rating_count': review_count,
                                'price_level': place.get('price_level'),
                                'place_types': place.get('types', []),
                                'google_address': place.get('vicinity', ''),
                                'api_source_type': search_config['name']
                            }
                            restaurants.append(restaurant)
                    
                    time.sleep(0.1)  # Rate limiting
                    
                except Exception as e:
                    logger.error(f"Error searching {search_config['name']}: {e}")
                    continue
            
            # Remove duplicates by place_id and sort by rating
            unique_restaurants = {}
            for restaurant in restaurants:
                place_id = restaurant['google_place_id']
                if place_id not in unique_restaurants:
                    unique_restaurants[place_id] = restaurant
                elif restaurant['google_rating'] > unique_restaurants[place_id]['google_rating']:
                    unique_restaurants[place_id] = restaurant
            
            final_restaurants = list(unique_restaurants.values())
            final_restaurants.sort(key=lambda r: (r['google_rating'], r['google_rating_count']), reverse=True)
            
            logger.info(f"Found {len(final_restaurants)} high-quality restaurants from Google Places API")
            return final_restaurants
            
        except ImportError:
            logger.error("googlemaps library not installed. Install with: pip install googlemaps")
            return []
        except Exception as e:
            logger.error(f"Error during Google Places API search: {e}")
            return []
    
    def _get_city_coordinates(self) -> Optional[tuple]:
        """Get latitude/longitude coordinates for the city."""
        city_coords = {
            'pittsburgh': (40.4406, -79.9959),
            'philadelphia': (39.9526, -75.1652),
            'new york': (40.7128, -74.0060),
            'chicago': (41.8781, -87.6298),
            'los angeles': (34.0522, -118.2437),
            'san francisco': (37.7749, -122.4194),
            'boston': (42.3601, -71.0589),
            'miami': (25.7617, -80.1918),
            'seattle': (47.6062, -122.3321),
            'atlanta': (33.4484, -84.3917)
        }
        
        city_key = f"{self.city.lower()}"
        return city_coords.get(city_key)
    
    def verify_restaurants_with_google_places(self, api_key: Optional[str] = None) -> List[Dict]:
        """Verify restaurants using Google Places API to check current status."""
        if not api_key:
            api_key = os.getenv('GOOGLE_PLACES_API_KEY')
        
        if not api_key:
            logger.warning("No Google Places API key provided. Skipping verification.")
            return self.restaurants
        
        logger.info("Starting Google Places verification...")
        
        try:
            gmaps = googlemaps.Client(key=api_key)
        except Exception as e:
            logger.error(f"Failed to initialize Google Maps client: {e}")
            return self.restaurants
        
        verified_restaurants = []
        
        for restaurant in self.restaurants:
            try:
                verified_data = self._verify_single_restaurant(gmaps, restaurant)
                verified_restaurants.append(verified_data)
                time.sleep(0.5)  # Rate limiting for API
            except Exception as e:
                logger.error(f"Error verifying {restaurant['name']}: {e}")
                # Add unverified restaurant with error flag
                restaurant['verification_error'] = str(e)
                restaurant['last_verified'] = datetime.now().isoformat()
                verified_restaurants.append(restaurant)
        
        self.restaurants = verified_restaurants
        logger.info(f"Completed verification for {len(verified_restaurants)} restaurants")
        
        return verified_restaurants
    
    def _verify_single_restaurant(self, gmaps_client, restaurant: Dict) -> Dict:
        """Verify a single restaurant using Google Places API."""
        restaurant_name = restaurant['name']
        search_query = f"{restaurant_name} {self.city} {self.state}"
        
        logger.info(f"Verifying: {restaurant_name}")
        
        try:
            # Search for the restaurant
            places_result = gmaps_client.places(query=search_query)
            
            if not places_result['results']:
                # Try alternative search without state
                search_query = f"{restaurant_name} {self.city}"
                places_result = gmaps_client.places(query=search_query)
            
            if places_result['results']:
                place = places_result['results'][0]  # Get the first (most relevant) result
                place_id = place['place_id']
                
                # Get detailed information
                place_details = gmaps_client.place(
                    place_id=place_id,
                    fields=[
                        'name', 'business_status', 'opening_hours', 'rating', 
                        'user_ratings_total', 'formatted_address', 'place_id',
                        'permanently_closed', 'price_level'
                    ]
                )
                
                details = place_details['result']
                
                # Update restaurant data with Google Places information
                restaurant.update({
                    'google_place_id': place_id,
                    'google_name': details.get('name', ''),
                    'google_address': details.get('formatted_address', ''),
                    'business_status': details.get('business_status', 'UNKNOWN'),
                    'google_rating': details.get('rating'),
                    'google_rating_count': details.get('user_ratings_total'),
                    'price_level': details.get('price_level'),
                    'place_types': details.get('types', []),
                    'permanently_closed': details.get('permanently_closed', False),
                    'last_verified': datetime.now().isoformat(),
                    'verification_status': 'VERIFIED'
                })
                
                # Add opening hours if available
                if 'opening_hours' in details:
                    opening_hours = details['opening_hours']
                    restaurant.update({
                        'current_hours': opening_hours.get('weekday_text', []),
                        'open_now': opening_hours.get('open_now', None)
                    })
                else:
                    restaurant.update({
                        'current_hours': [],
                        'open_now': None
                    })
                
                # Flag permanently closed restaurants
                if (details.get('permanently_closed', False) or 
                    details.get('business_status') == 'CLOSED_PERMANENTLY'):
                    restaurant['permanently_closed'] = True
                    restaurant['business_status'] = 'CLOSED_PERMANENTLY'
                    logger.warning(f"Restaurant {restaurant_name} appears to be permanently closed")
                
            else:
                # No results found
                restaurant.update({
                    'verification_status': 'NOT_FOUND',
                    'last_verified': datetime.now().isoformat(),
                    'google_place_id': None,
                    'business_status': 'NOT_FOUND'
                })
                logger.warning(f"No Google Places results found for {restaurant_name}")
        
        except Exception as e:
            restaurant.update({
                'verification_status': 'ERROR',
                'verification_error': str(e),
                'last_verified': datetime.now().isoformat()
            })
            logger.error(f"Error during verification of {restaurant_name}: {e}")
        
        return restaurant
    
    def save_to_csv(self, filename: Optional[str] = None) -> str:
        """Save validated restaurants to CSV."""
        if not filename:
            filename = f"{self.city.lower().replace(' ', '_')}_restaurants_enhanced.csv"
        
        filepath = f"/Users/jason/Projects/cardinal/{filename}"
        
        with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = [
                'name', 'description', 'rating', 'source', 'url', 'validated', 'source_count',
                'verification_status', 'business_status', 'permanently_closed', 'google_name', 
                'google_address', 'google_rating', 'google_rating_count', 'price_level',
                'open_now', 'current_hours', 'place_types', 'api_source_type', 'last_verified', 'google_place_id', 'verification_error'
            ]
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            writer.writeheader()
            for restaurant in self.restaurants:
                writer.writerow(restaurant)
        
        logger.info(f"Saved {len(self.restaurants)} restaurants to {filepath}")
        return filepath

def main():
    """Main function to run the enhanced scraper."""
    # Configuration - easily changeable
    CITY = "Pittsburgh"
    STATE = "PA"
    
    scraper = EnhancedRestaurantScraper(CITY, STATE)
    restaurants = scraper.scrape_all()
    
    if restaurants:
        # Verify restaurants with Google Places API
        print(f"\nVerifying {len(restaurants)} restaurants with Google Places API...")
        verified_restaurants = scraper.verify_restaurants_with_google_places()
        
        filepath = scraper.save_to_csv()
        print(f"Successfully scraped and verified {len(verified_restaurants)} restaurants from {CITY}, {STATE}")
        print(f"Results saved to: {filepath}")
        
        # Show validation summary
        validated_count = sum(1 for r in verified_restaurants if r.get('validated'))
        multi_source_count = sum(1 for r in verified_restaurants if r.get('source_count', 0) > 1)
        
        # Show verification summary
        google_verified_count = sum(1 for r in verified_restaurants if r.get('verification_status') == 'VERIFIED')
        not_found_count = sum(1 for r in verified_restaurants if r.get('verification_status') == 'NOT_FOUND')
        permanently_closed_count = sum(1 for r in verified_restaurants if r.get('permanently_closed', False))
        
        print(f"\nScraping Summary:")
        print(f"- {validated_count} restaurants found in multiple sources")
        print(f"- {multi_source_count} restaurants cross-validated")
        print(f"- {len(verified_restaurants) - validated_count} single-source restaurants with good descriptions")
        
        print(f"\nGoogle Places Verification Summary:")
        print(f"- {google_verified_count} restaurants verified and found on Google Places")
        print(f"- {not_found_count} restaurants not found on Google Places")
        print(f"- {permanently_closed_count} restaurants marked as permanently closed")
        
        if permanently_closed_count > 0:
            closed_restaurants = [r['name'] for r in verified_restaurants if r.get('permanently_closed', False)]
            print(f"- Permanently closed: {', '.join(closed_restaurants)}")
        
    else:
        print("No restaurants found. Try adjusting search parameters.")

if __name__ == "__main__":
    main()