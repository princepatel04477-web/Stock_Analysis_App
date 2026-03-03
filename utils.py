# import pandas as pd
# import yfinance as yf
# import plotly.graph_objects as go
# import upstox_client
# from upstox_client.rest import ApiException
# from ta.momentum import RSIIndicator
# from ta.trend import SMAIndicator
# from textblob import TextBlob
# from newsapi import NewsApiClient
# from nse_data import get_instrument_key
#
#
# def analyze_technical(df):
#     """
#     Analyzes technical indicators from the dataframe.
#     Expects a DataFrame with 'close' column.
#     """
#     # Clean column names just in case: strip whitespace and lower case
#     df.columns = [c.strip().lower() for c in df.columns]
#
#     # Check required columns and handle variations
#     # We primarily need 'close' for the requested indicators
#     if 'close' not in df.columns:
#         # Try to find something that looks like close
#         possible_close = [c for c in df.columns if 'close' in c or 'ltp' in c or 'last' in c]
#         if possible_close:
#             df['close'] = df[possible_close[0]]
#         else:
#             raise ValueError("CSV must contain a 'Close' price column.")
#
#     # Calculate Indicators
#
#     # RSI (14)
#     # Using 'close' column
#     rsi_indicator = RSIIndicator(close=df['close'], window=14)
#     df['rsi'] = rsi_indicator.rsi()
#
#     # SMA (20)
#     sma20 = SMAIndicator(close=df['close'], window=20)
#     df['sma_20'] = sma20.sma_indicator()
#
#     # SMA (50)
#     sma50 = SMAIndicator(close=df['close'], window=50)
#     df['sma_50'] = sma50.sma_indicator()
#
#     # Get latest valid data point (ignoring last rows if they are NaN for some reason,
#     # but usually indicators introduce NaNs at the start. We want the last row.)
#     if df.empty:
#         raise ValueError("DataFrame is empty.")
#
#     latest = df.iloc[-1]
#
#     close_price = latest['close']
#     rsi_val = latest['rsi']
#     sma_20_val = latest['sma_20']
#
#     # Handle NaN values if not enough data for indicators
#     if pd.isna(rsi_val) or pd.isna(sma_20_val):
#         # Try to find the last valid index
#         last_valid_index = df['rsi'].last_valid_index()
#         if last_valid_index is not None:
#             latest = df.loc[last_valid_index]
#             rsi_val = latest['rsi']
#             sma_20_val = latest['sma_20']
#             close_price = latest['close']
#         else:
#             raise ValueError("Not enough data points to calculate indicators (need at least 20 for SMA).")
#
#     # Technical Logic (Simple but Smart)
#     signal = "HOLD"
#     reasons = []
#
#     # Logic from prompt:
#     # RSI < 30 -> Oversold -> Buy bias
#     # Price > MA -> Uptrend
#
#     score = 0
#
#     # RSI Logic
#     if rsi_val < 30:
#         score += 1
#         reasons.append("RSI indicates oversold condition (< 30).")
#     elif rsi_val > 70:
#         score -= 1
#         reasons.append("RSI indicates overbought condition (> 70).")
#     else:
#         # reasons.append(f"RSI is neutral ({rsi_val:.2f}).")
#         pass
#
#     # SMA Logic
#     if close_price > sma_20_val:
#         score += 1
#         reasons.append("Price is above 20-day Moving Average (Uptrend).")
#     else:
#         score -= 1
#         reasons.append("Price is below 20-day Moving Average (Downtrend).")
#
#     if score >= 1:
#         signal = "BUY"
#     elif score <= -1:
#         signal = "SELL"
#     else:
#         signal = "HOLD"
#
#     return {
#         "signal": signal,
#         "close_price": close_price,
#         "rsi": rsi_val,
#         "sma_20": sma_20_val,
#         "technical_reasons": reasons
#     }
#
#
# def analyze_sentiment(text):
#     """
#     Analyzes sentiment of the text using TextBlob.
#     Returns: sentiment (POSITIVE/NEGATIVE/NEUTRAL), score
#     """
#     if not text or not text.strip():
#         return "NEUTRAL", 0.0
#
#     blob = TextBlob(text)
#     # Polarity is between -1.0 and 1.0
#     polarity = blob.sentiment.polarity
#
#     # Using 0.05 threshold similar to VADER logic, though TextBlob is often softer
#     if polarity >= 0.05:
#         sentiment = "POSITIVE"
#     elif polarity <= -0.05:
#         sentiment = "NEGATIVE"
#     else:
#         sentiment = "NEUTRAL"
#
#     return sentiment, polarity
#
#
# def fusion_engine(tech_data, sentiment, sentiment_score):
#     """
#     Combines technical and sentiment signals.
#     """
#     tech_signal = tech_data['signal']
#     close_price = tech_data['close_price']
#
#     final_signal = tech_signal
#     reasoning = tech_data['technical_reasons'][:]  # Copy list
#
#     # Add sentiment reasoning
#     reasoning.append(f"Recent news shows {sentiment.lower()} sentiment.")
#
#     # Fusion Logic (Simple but Smart)
#     # Technical = BUY
#     # News Sentiment = POSITIVE ➡ Strong Buy
#     # Technical = BUY
#     # News = NEGATIVE ➡ Weak Buy / Hold
#
#     if tech_signal == "BUY":
#         if sentiment == "POSITIVE":
#             final_signal = "STRONG BUY"
#             reasoning.append("Fusion: Technical uptrend + Positive news = Strong Buy.")
#         elif sentiment == "NEGATIVE":
#             final_signal = "WEAK BUY / HOLD"
#             reasoning.append("Fusion: Negative news reduces technical buy confidence.")
#
#     elif tech_signal == "SELL":
#         if sentiment == "NEGATIVE":
#             final_signal = "STRONG SELL"
#             reasoning.append("Fusion: Technical downtrend + Negative news = Strong Sell.")
#         elif sentiment == "POSITIVE":
#             final_signal = "WEAK SELL / HOLD"
#             reasoning.append("Fusion: Positive news contradicts technical sell signal.")
#
#     elif tech_signal == "HOLD":
#         if sentiment == "POSITIVE":
#             final_signal = "WEAK BUY"
#             reasoning.append("Fusion: Positive news provides slight bullish bias to neutral technicals.")
#         elif sentiment == "NEGATIVE":
#             final_signal = "WEAK SELL"
#             reasoning.append("Fusion: Negative news provides slight bearish bias to neutral technicals.")
#
#     # Target Price Calculation
#     # Target = Buying Price + (Buying Price × 3–5%)
#     # Only calculate meaningful target if Buying, but we output it anyway as requested.
#
#     target_percentage = 0.04  # 4%
#     target_price = close_price * (1 + target_percentage)
#
#     reasoning.append(
#         "Target price is calculated using conservative percentage-based forecasting suitable for short-term trading.")
#
#     return {
#         "final_signal": final_signal,
#         "buying_price": close_price,
#         "target_price": target_price,
#         "reasoning": reasoning,
#         "news_sentiment": sentiment
#     }
#
#
# def fetch_live_data_yfinance(ticker):
#     """
#     Fetches live stock data for the given ticker using yfinance.
#     Appends .NS if it doesn't look like an exchange-specified ticker and is likely Indian.
#     """
#     ticker = ticker.upper().strip()
#     if not ticker.endswith(".NS") and not ticker.endswith(".BO") and not "-" in ticker:
#         ticker += ".NS"  # Default to NSE
#
#     stock = yf.Ticker(ticker)
#     df = stock.history(period="6mo")  # Get 6 months of data
#
#     if df.empty:
#         raise ValueError(f"No data found for {ticker} on Yahoo Finance.")
#
#     # Reset index to make Date a column
#     df.reset_index(inplace=True)
#
#     # Ensure columns are lower case for utils compatibility
#     df.columns = [c.lower() for c in df.columns]
#
#     # yfinance often returns 'date' with timezone. Remove it for consistency.
#     if 'date' in df.columns:
#         df['date'] = df['date'].dt.tz_localize(None)
#
#     return df, ticker
#
#
# def get_upstox_instrument_key(ticker):
#     """
#     Helper to get Upstox Instrument Key.
#     For this demo, we assume NSE Equity.
#     Ideally, we should search instrument list.
#     """
#     # This is a very basic mapping or assumption for common stocks
#     # In production, one would download the huge instrument list and search it.
#     # For a demo, the user might need to input the ISIN or we map some popular ones.
#
#     # Fallback: Check if we can just assume NSE_EQ|{ISIN} or NSE_EQ|{Symbol}
#     # Upstox API v2 often uses 'NSE_EQ|INE...'
#     # If the user provides just 'RELIANCE', we are in trouble without the instrument file.
#
#     # Hack for demo: Let's assume the user enters the symbol, and we try to map it
#     # or just tell them "Please enter Instrument Key (e.g. NSE_EQ|INE002A01018)"
#
#     # However, to be helpful, let's just return what they typed and hope they typed the key,
#     # or prepended NSE_EQ|
#
#     return ticker
#
#
# def fetch_live_data_upstox(instrument_key, access_token):
#     """
#     Fetches historical candle data from Upstox API v2.
#     """
#     if not access_token:
#         raise ValueError("Upstox Access Token is missing.")
#
#     configuration = upstox_client.Configuration()
#     configuration.access_token = access_token
#
#     api_instance = upstox_client.HistoryApi(upstox_client.ApiClient(configuration))
#
#     # Params
#     # instrument_key e.g. NSE_EQ|INE002A01018
#     interval = '1day'  # or 'day'
#     to_date = pd.Timestamp.now().strftime('%Y-%m-%d')
#     from_date = (pd.Timestamp.now() - pd.Timedelta(days=180)).strftime('%Y-%m-%d')  # 6 months
#
#     try:
#         api_response = api_instance.get_historical_candle_data1(instrument_key, interval, to_date, from_date, "2.0")
#
#         if api_response.status == 'success' and api_response.data and api_response.data.candles:
#             # Data format: [[timestamp, open, high, low, close, volume, oi], ...]
#             cols = ['date', 'open', 'high', 'low', 'close', 'volume', 'oi']
#             df = pd.DataFrame(api_response.data.candles, columns=cols)
#
#             # Convert date
#             df['date'] = pd.to_datetime(df['date'])
#             # Ensure columns are float where needed
#             for c in ['open', 'high', 'low', 'close', 'volume']:
#                 df[c] = df[c].astype(float)
#
#             # Upstox returns data in reverse chronological order usually? Or check.
#             # Usually we want ascending date for charts
#             df = df.sort_values('date')
#
#             return df, instrument_key
#         else:
#             raise ValueError(f"Upstox API returned success but no data for {instrument_key}")
#
#     except ApiException as e:
#         raise ValueError(f"Upstox API Exception: {e}")
#     except Exception as e:
#         raise ValueError(f"Error fetching Upstox data: {e}")
#
#
# def fetch_live_data(ticker, source="yfinance", upstox_token=None):
#     """
#     Wrapper to fetch data from chosen source.
#     """
#     if source == "upstox":
#         return fetch_live_data_upstox(ticker, upstox_token)
#     else:
#         return fetch_live_data_yfinance(ticker)
#
#
# def fetch_news_newsapi(ticker, api_key):
#     """
#     Fetches news headlines using NewsAPI.org.
#     """
#     try:
#         newsapi = NewsApiClient(api_key=api_key)
#
#         # Clean ticker for search (remove .NS etc)
#         search_term = ticker
#         if "|" in ticker:
#             # It's an instrument key. It's hard to get name from it without map.
#             # We assume the caller passed the Symbol if possible, OR we can't search well.
#             # But if app passes 'RELIANCE' (and utils maps it to key for upstox),
#             # we should use 'RELIANCE' here.
#             # Wait, fetch_live_data returns (df, clean_ticker).
#             # If clean_ticker is the key, we have a problem.
#             # Let's handle it in app.py to pass the symbol name for news search?
#             # Or try to extract something.
#             pass
#
#         if "." in ticker:
#             search_term = ticker.split(".")[0]
#
#         # Fetch Top Headlines or Everything?
#         # Everything gives more results for specific stocks
#         all_articles = newsapi.get_everything(q=search_term,
#                                               language='en',
#                                               sort_by='publishedAt',
#                                               page_size=5)
#
#         headlines = []
#         if all_articles['status'] == 'ok':
#             for article in all_articles['articles']:
#                 headlines.append(article['title'])
#
#         combined_text = ". ".join(headlines)
#         return combined_text
#     except Exception as e:
#         # Fallback or error
#         print(f"NewsAPI Error: {e}")
#         return None
#
#
# def fetch_live_news(ticker, api_key=None):
#     """
#     Fetches news headlines.
#     Prioritizes NewsAPI if api_key is provided.
#     Falls back to yfinance.
#     """
#     combined_text = None
#
#     if api_key:
#         combined_text = fetch_news_newsapi(ticker, api_key)
#
#     if not combined_text:
#         # Fallback to yfinance
#         try:
#             # Clean ticker for yfinance compatibility if it's an Upstox key
#             yf_ticker = ticker
#             if "|" in ticker:
#                 # Can't use Upstox key in yfinance
#                 # Fallback to generic symbol if we can guess it, otherwise fail
#                 return "No news found (Upstox key used, try NewsAPI)."
#
#             if not yf_ticker.endswith(".NS"):
#                 yf_ticker += ".NS"
#
#             ticker_obj = yf.Ticker(yf_ticker)
#             news_list = ticker_obj.news
#
#             headlines = []
#             if news_list:
#                 for n in news_list:
#                     # Handle nested 'content' structure or flat structure
#                     if 'content' in n and 'title' in n['content']:
#                         headlines.append(n['content']['title'])
#                     elif 'title' in n:
#                         headlines.append(n['title'])
#
#             # Combine first 3-5 headlines
#             combined_text = ". ".join(headlines[:5])
#         except:
#             return "No news found."
#
#     return combined_text
#
#
# def create_chart(df, ticker):
#     """
#     Creates a Plotly candlestick chart with SMA overlays.
#     """
#     # Ensure indicators are calculated
#     if 'sma_20' not in df.columns:
#         sma20 = SMAIndicator(close=df['close'], window=20)
#         df['sma_20'] = sma20.sma_indicator()
#
#     if 'sma_50' not in df.columns:
#         sma50 = SMAIndicator(close=df['close'], window=50)
#         df['sma_50'] = sma50.sma_indicator()
#
#     fig = go.Figure()
#
#     # Handle Date column: if 'date' exists use it, else try index
#     if 'date' in df.columns:
#         x_axis = df['date']
#     else:
#         # Assuming index is date if no date column, useful for CSVs that haven't been reset_index
#         x_axis = df.index
#
#     # Candlestick
#     fig.add_trace(go.Candlestick(
#         x=x_axis,
#         open=df['open'],
#         high=df['high'],
#         low=df['low'],
#         close=df['close'],
#         name='Price'
#     ))
#
#     # SMA 20
#     fig.add_trace(go.Scatter(
#         x=x_axis,
#         y=df['sma_20'],
#         mode='lines',
#         name='SMA 20',
#         line=dict(color='orange', width=1.5)
#     ))
#
#     # SMA 50
#     fig.add_trace(go.Scatter(
#         x=x_axis,
#         y=df['sma_50'],
#         mode='lines',
#         name='SMA 50',
#         line=dict(color='blue', width=1.5)
#     ))
#
#     fig.update_layout(
#         title=f'{ticker} Stock Price',
#         yaxis_title='Price (INR)',
#         xaxis_title='Date',
#         template='plotly_dark',
#         height=600
#     )
#
#     return fig
