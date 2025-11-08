from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
import feedparser
from datetime import datetime, timedelta

router = APIRouter()

class NewsArticle(BaseModel):
    title: str
    time_ago: str
    url: str

class NewsResponse(BaseModel):
    articles: list[NewsArticle]

@router.get("/news/agriculture")
def get_agriculture_news() -> NewsResponse:
    """
    Get latest agriculture news from RSS feeds.
    """
    articles = []
    
    # Try multiple agriculture news sources
    rss_feeds = [
        "https://krishijagran.com/rss/news/",
        "https://www.feedspot.com/infiniterss.php?_src=feed_title&followfeedid=4858156",
    ]
    
    for feed_url in rss_feeds:
        try:
            feed = feedparser.parse(feed_url)
            
            for entry in feed.entries[:5]:  # Get top 5 from each feed
                # Parse published date
                time_ago = "Recently"
                if hasattr(entry, 'published_parsed') and entry.published_parsed:
                    pub_date = datetime(*entry.published_parsed[:6])
                    diff = datetime.now() - pub_date
                    
                    if diff.days == 0:
                        hours = diff.seconds // 3600
                        if hours == 0:
                            time_ago = "Just now"
                        elif hours == 1:
                            time_ago = "1 hour ago"
                        else:
                            time_ago = f"{hours} hours ago"
                    elif diff.days == 1:
                        time_ago = "1 day ago"
                    else:
                        time_ago = f"{diff.days} days ago"
                
                articles.append(
                    NewsArticle(
                        title=entry.title,
                        time_ago=time_ago,
                        url=entry.link
                    )
                )
            
            # If we got articles from first feed, break
            if articles:
                break
                
        except Exception as e:
            print(f"Error fetching from {feed_url}: {e}")
            continue
    
    # Fallback to static news if all feeds fail
    if not articles:
        articles = [
            NewsArticle(
                title="New government subsidy scheme announced",
                time_ago="2 hours ago",
                url="https://krishijagran.com"
            ),
            NewsArticle(
                title="Monsoon forecast predicts good rainfall this season",
                time_ago="5 hours ago",
                url="https://krishijagran.com"
            ),
            NewsArticle(
                title="Organic farming workshops starting next month",
                time_ago="1 day ago",
                url="https://krishijagran.com"
            ),
        ]
    
    # Return max 10 articles
    return NewsResponse(articles=articles[:10])
