import streamlit as st
import plotly.graph_objects as go
import yfinance as yf
from ta.trend import SMAIndicator
import os
from dotenv import load_dotenv
from services.stock_services import get_all_stocks
from services.price_service import fetch_market_data, fetch_stock_news
from ai.utils_perplexity import fetch_latest_data_perplexity
from ai.utils_groq import analyze_stock_groq

# Load environment variables
load_dotenv()

# Get API keys from environment (secure)
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")


def fetch_chart_data(ticker):
    """
    Fetches historical stock data for charting using yfinance.
    """
    ticker_yf = ticker.upper().strip()
    if not ticker_yf.endswith(".NS") and not ticker_yf.endswith(".BO"):
        ticker_yf += ".NS"  # Default to NSE

    try:
        stock = yf.Ticker(ticker_yf)
        df = stock.history(period="6mo")

        if df.empty:
            return None

        df.reset_index(inplace=True)
        df.columns = [c.lower() for c in df.columns]

        # Calculate SMAs
        if len(df) >= 20:
            sma20 = SMAIndicator(close=df["close"], window=20)
            df["sma_20"] = sma20.sma_indicator()
        if len(df) >= 50:
            sma50 = SMAIndicator(close=df["close"], window=50)
            df["sma_50"] = sma50.sma_indicator()

        return df
    except Exception:
        return None


def create_chart(df, ticker):
    """
    Creates a Plotly candlestick chart with SMA overlays.
    """
    fig = go.Figure()

    x_axis = df["date"] if "date" in df.columns else df.index

    # Candlestick
    fig.add_trace(
        go.Candlestick(
            x=x_axis,
            open=df["open"],
            high=df["high"],
            low=df["low"],
            close=df["close"],
            name="Price",
            increasing=dict(line=dict(color="#3FB950")),
            decreasing=dict(line=dict(color="#F85149")),
        )
    )

    # SMA 20
    if "sma_20" in df.columns:
        fig.add_trace(
            go.Scatter(
                x=x_axis,
                y=df["sma_20"],
                mode="lines",
                name="SMA 20",
                line=dict(color="#FFA500", width=1.5),
            )
        )

    # SMA 50
    if "sma_50" in df.columns:
        fig.add_trace(
            go.Scatter(
                x=x_axis,
                y=df["sma_50"],
                mode="lines",
                name="SMA 50",
                line=dict(color="#00BFFF", width=1.5),
            )
        )

    fig.update_layout(
        title=dict(text=f"{ticker} Stock Price (6 Months)", font=dict(color="white")),
        yaxis_title="Price (INR)",
        xaxis_title="Date",
        template="plotly_dark",
        height=400,
        paper_bgcolor="#1E2130",
        plot_bgcolor="#0E1117",
        font=dict(color="white"),
        xaxis=dict(gridcolor="#30363D", color="white"),
        yaxis=dict(gridcolor="#30363D", color="white"),
        legend=dict(font=dict(color="white")),
    )

    return fig


def generate_simple_analysis(ticker, market_data):
    """
    Generates a simple rule-based analysis when Groq API is not available.
    """
    curr_price = market_data.get("current_price", 0)
    rsi = market_data.get("rsi_14", 50)
    sma_20 = market_data.get("sma_20", 0)
    change_pct = market_data.get("change_percent", 0)

    # Calculate signals
    signal = "HOLD"
    reasoning = []

    # RSI logic
    if rsi < 30:
        signal = "BUY"
        reasoning.append(f"RSI at {rsi:.1f} indicates oversold conditions")
    elif rsi > 70:
        signal = "SELL"
        reasoning.append(f"RSI at {rsi:.1f} indicates overbought conditions")
    else:
        reasoning.append(f"RSI at {rsi:.1f} is neutral")

    # Price vs SMA logic
    if curr_price > sma_20:
        if signal == "HOLD":
            signal = "BUY"
        reasoning.append(
            f"Price (₹{curr_price:.2f}) is above 20-day SMA (₹{sma_20:.2f})"
        )
    else:
        if signal == "HOLD":
            signal = "SELL"
        reasoning.append(
            f"Price (₹{curr_price:.2f}) is below 20-day SMA (₹{sma_20:.2f})"
        )

    # Change percent logic
    if change_pct > 2:
        reasoning.append(f"Strong positive momentum (+{change_pct:.2f}%)")
    elif change_pct < -2:
        reasoning.append(f"Strong negative momentum ({change_pct:.2f}%)")

    # Target price calculation
    if signal in ["BUY", "STRONG BUY"]:
        target_price = curr_price * 1.05  # 5% upside target
    elif signal in ["SELL", "STRONG SELL"]:
        target_price = curr_price * 0.95  # 5% downside target
    else:
        target_price = curr_price

    return {
        "signal": signal,
        "target_price": target_price,
        "reasoning": reasoning,
        "summary": f"Based on technical indicators, {ticker} shows a {signal} signal. Current price is ₹{curr_price:.2f} with RSI at {rsi:.1f}.",
    }


# -----------------------------------------------------------------------------
# 0. Configuration
# -----------------------------------------------------------------------------
# API keys are now loaded from environment variables (.env file)
# Do NOT hardcode API keys in this file

# -----------------------------------------------------------------------------
# 1. Page Configuration & Styling
# -----------------------------------------------------------------------------
st.set_page_config(layout="wide", page_title="NiftyPulse", page_icon="📈")

st.markdown(
    """
<style>
    /* Global Theme */
    .stApp {
        background-color: #0E1117;
        color: #FAFAFA;
    }

    /* Sidebar */
    [data-testid="stSidebar"] {
        background-color: #161B22;
        border-right: 1px solid #30363D;
    }

    /* Cards */
    .metric-card {
        background-color: #1E2130;
        border: 1px solid #2E3245;
        border-radius: 12px;
        padding: 20px;
        color: white;
        margin-bottom: 15px;
        height: 100%;
    }

    /* Typography */
    h1, h2, h3, h4 { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }

    /* Custom Header */
    .stock-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 20px;
        border-bottom: 1px solid #30363D;
        margin-bottom: 20px;
    }

    .stock-title { font-size: 2.5rem; font-weight: bold; margin: 0; display: flex; align-items: center; gap: 10px; }
    .stock-badge { font-size: 0.8rem; background: #2E3245; padding: 4px 8px; border-radius: 4px; color: #8B949E; font-weight: normal; }
    .price-container { text-align: right; }
    .stock-price { font-size: 2.5rem; font-weight: bold; color: #FAFAFA; }
    .stock-change { font-size: 1rem; font-weight: 600; padding: 5px 12px; border-radius: 20px; margin-left: 10px; display: inline-block; }
    .positive { background-color: rgba(63, 185, 80, 0.2); color: #3FB950; }
    .negative { background-color: rgba(248, 81, 73, 0.2); color: #F85149; }

    /* AI Summary */
    .ai-summary-box {
        background: linear-gradient(135deg, #1f2430 0%, #13161c 100%);
        border: 1px solid #30363D;
        border-radius: 12px;
        padding: 20px;
    }
    .sentiment-pill {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.8em;
        font-weight: bold;
    }

    /* Tech Table */
    .tech-table {
        width: 100%;
        border-collapse: collapse;
    }
    .tech-table td {
        padding: 10px;
        border-bottom: 1px solid #30363D;
    }
    .tech-val {
        text-align: right;
        font-weight: bold;
        font-family: monospace;
        font-size: 1.1em;
    }
</style>
""",
    unsafe_allow_html=True,
)

# Initialize Session State
if "market_data" not in st.session_state:
    st.session_state["market_data"] = None
if "analysis_result" not in st.session_state:
    st.session_state["analysis_result"] = None
if "current_ticker" not in st.session_state:
    st.session_state["current_ticker"] = "RELIANCE"
if "chart_data" not in st.session_state:
    st.session_state["chart_data"] = None

# -----------------------------------------------------------------------------
# Top Navigation Bar
# -----------------------------------------------------------------------------
nav_col1, nav_col2, nav_col3 = st.columns([2, 5, 2])

with nav_col1:
    st.title("⚡ NiftyPulse")
    st.caption("Powered by Perplexity & Groq")

with nav_col3:
    st.write("") # Spacing
    st.write("")
    try:
        with st.popover("⚙️ API Config", use_container_width=True):
            pplx_key = st.text_input(
                "Perplexity API Key",
                value=PERPLEXITY_API_KEY,
                type="password",
                help="Set in .env file for security.",
            )
            groq_key = st.text_input(
                "Groq API Key",
                value=GROQ_API_KEY,
                type="password",
                help="Set in .env file for security.",
            )
    except AttributeError:
        # Fallback for older Streamlit versions without st.popover
        with st.expander("⚙️ API Config"):
            pplx_key = st.text_input(
                "Perplexity API Key",
                value=PERPLEXITY_API_KEY,
                type="password",
                help="Set in .env file for security.",
            )
            groq_key = st.text_input(
                "Groq API Key",
                value=GROQ_API_KEY,
                type="password",
                help="Set in .env file for security.",
            )
            
st.divider()

# -----------------------------------------------------------------------------
# 2. Sidebar & State
# -----------------------------------------------------------------------------
with st.sidebar:
    st.subheader("🔍 Stock Selection")

    # Simple Text Input for now with autocomplete via DB could be complex in Streamlit
    # without a custom component. We'll use a Selectbox with top stocks + manual search.
    # To avoid loading 2000 stocks into selectbox every time, we'll just load them. 2000 is fine.

    all_stocks = get_all_stocks()
    # Format: "SYMBOL - NAME"

    default_idx = 0
    # Try to find Reliance
    for i, s in enumerate(all_stocks):
        if s.startswith("RELIANCE"):
            default_idx = i
            break

    selected_stock_str = st.selectbox("Search Stock", all_stocks, index=default_idx)

    # Extract just the symbol
    selected_ticker = (
        selected_stock_str.split(" - ")[0] if selected_stock_str else "RELIANCE"
    )

    if st.button("Analyze Stock", type="primary", use_container_width=True):
        with st.spinner(f"Fetching live data for {selected_ticker}..."):
            # Use yfinance for live prices (reliable real-time data)
            market_data = fetch_market_data(selected_ticker)

            # Fetch news
            news_items = fetch_stock_news(selected_ticker)
            news_summary = "\n".join([f"- {item['title']}" for item in news_items[:3]])
            market_data["news_summary"] = (
                news_summary if news_summary else "No recent news available."
            )

            # Use Perplexity for sentiment analysis if API key is available
            if pplx_key:
                perplexity_data = fetch_latest_data_perplexity(
                    selected_ticker, pplx_key
                )
                if "error" not in perplexity_data:
                    # Merge sentiment data from Perplexity
                    market_data["sentiment"] = perplexity_data.get(
                        "sentiment", "Neutral"
                    )
                else:
                    market_data["sentiment"] = "Neutral"
            else:
                market_data["sentiment"] = "Neutral"

        if "error" in market_data:
            st.error(market_data["error"])
        else:
            st.session_state["market_data"] = market_data
            st.session_state["current_ticker"] = selected_ticker

            with st.spinner("Generating trading signal..."):
                if groq_key:
                    # Use Groq AI for analysis
                    analysis = analyze_stock_groq(
                        selected_ticker, market_data, groq_key
                    )
                else:
                    # Simple rule-based analysis if no Groq API key
                    analysis = generate_simple_analysis(selected_ticker, market_data)

            if "error" in analysis:
                st.error(analysis["error"])
            else:
                st.session_state["analysis_result"] = analysis

                # Fetch chart data
                with st.spinner("Loading price chart..."):
                    chart_data = fetch_chart_data(selected_ticker)
                    st.session_state["chart_data"] = chart_data

# -----------------------------------------------------------------------------
# 3. Main Dashboard
# -----------------------------------------------------------------------------

market_data = st.session_state["market_data"]
analysis = st.session_state["analysis_result"]
ticker = st.session_state["current_ticker"]
chart_data = st.session_state.get("chart_data", None)

if market_data and analysis:
    # --- Top Header ---
    curr_price = market_data.get("current_price", 0.0)
    change_pct = market_data.get("change_percent", 0.0)

    # Sometimes change_pct might be None if Perplexity couldn't find it
    if curr_price is None:
        curr_price = 0.0
    if change_pct is None:
        change_pct = 0.0

    change_class = "positive" if change_pct >= 0 else "negative"
    sign = "+" if change_pct >= 0 else ""

    st.markdown(
        f"""
    <div class="stock-header">
        <div>
            <h1 class="stock-title">{ticker} <span class="stock-badge">NSE</span></h1>
            <div style="color: #8B949E; margin-top: 5px;">Live Data via Perplexity • AI Analysis</div>
        </div>
        <div class="price-container">
            <div class="stock-price">₹{curr_price:,.2f}</div>
            <div class="stock-change {change_class}">{sign}{change_pct:.2f}%</div>
        </div>
    </div>
    """,
        unsafe_allow_html=True,
    )

    # --- Main Grid ---
    col_chart, col_info = st.columns([1, 1])

    # Left: Technical Snapshot (Replacing Chart)
    with col_chart:
        st.subheader("📊 Technical Snapshot")

        rsi_val = market_data.get("rsi_14", 50)
        sma20_val = market_data.get("sma_20", 0)
        sma50_val = market_data.get("sma_50", 0)

        # Color coding
        rsi_color = "#F85149" if (rsi_val > 70 or rsi_val < 30) else "#3FB950"

        st.markdown(
            f"""
        <div class="metric-card">
            <table class="tech-table">
                <tr>
                    <td>RSI (14)</td>
                    <td class="tech-val" style="color: {rsi_color}">{rsi_val if rsi_val else "N/A"}</td>
                </tr>
                <tr>
                    <td>SMA (20)</td>
                    <td class="tech-val">₹{sma20_val if sma20_val else "N/A"}</td>
                </tr>
                <tr>
                    <td>SMA (50)</td>
                    <td class="tech-val">₹{sma50_val if sma50_val else "N/A"}</td>
                </tr>
            </table>
            <br>
            <div style="font-size: 0.9em; color: #8B949E;">
                *Data retrieved via Perplexity Search. Values are approximate.
            </div>
        </div>
        """,
            unsafe_allow_html=True,
        )

        # News Summary Card
        st.subheader("📰 Market News")
        st.markdown(
            f"""
        <div class="metric-card" style="font-size: 0.9rem; line-height: 1.5;">
            {market_data.get("news_summary", "No news available.")}
            <br><br>
            <span class="sentiment-pill" style="border: 1px solid #79C0FF; color: #79C0FF;">
                Sentiment: {market_data.get("sentiment", "Neutral")}
            </span>
        </div>
        """,
            unsafe_allow_html=True,
        )

        # Analyst Rating Card
        analyst_rating = market_data.get("analyst_rating", "N/A")
        if analyst_rating and analyst_rating != "N/A":
            rating_color = (
                "#3FB950"
                if "buy" in analyst_rating.lower()
                else ("#F85149" if "sell" in analyst_rating.lower() else "#FFA500")
            )
            st.markdown(
                f"""
            <div class="metric-card" style="margin-top: 10px;">
                <div style="font-size: 0.9em; color: #8B949E;">Analyst Consensus Rating</div>
                <div style="font-size: 1.5em; font-weight: bold; color: {rating_color}; margin-top: 5px;">{analyst_rating}</div>
            </div>
            """,
                unsafe_allow_html=True,
            )

    # Right: Signal & Reasoning
    with col_info:
        # Signal Gauge
        sig_text = analysis.get("signal", "HOLD").upper()

        gauge_val = 50
        color = "#E1E4E8"
        if "STRONG BUY" in sig_text:
            gauge_val, color = 85, "#3FB950"
        elif "STRONG SELL" in sig_text:
            gauge_val, color = 15, "#F85149"
        elif "BUY" in sig_text:
            gauge_val, color = 70, "#3FB950"
        elif "SELL" in sig_text:
            gauge_val, color = 30, "#F85149"

        fig_gauge = go.Figure(
            go.Indicator(
                mode="gauge+number",
                value=gauge_val,
                title={
                    "text": "SIGNAL STRENGTH",
                    "font": {"size": 14, "color": "#8B949E"},
                },
                number={"font": {"size": 40, "color": "white"}},
                gauge={
                    "axis": {"range": [0, 100], "tickwidth": 1, "tickcolor": "#30363D"},
                    "bar": {"color": color},
                    "bgcolor": "#0D1117",
                    "borderwidth": 2,
                    "bordercolor": "#30363D",
                    "steps": [
                        {"range": [0, 40], "color": "#161B22"},
                        {"range": [40, 60], "color": "#161B22"},
                        {"range": [60, 100], "color": "#161B22"},
                    ],
                },
            )
        )
        fig_gauge.update_layout(
            height=250,
            margin=dict(l=20, r=20, t=50, b=20),
            paper_bgcolor="#1E2130",
            font={"family": "Arial"},
        )
        st.plotly_chart(fig_gauge, use_container_width=True)

        st.markdown(
            f"<div style='text-align: center; font-weight: bold; color: {color}; margin-top: -20px; margin-bottom: 20px;'>{sig_text}</div>",
            unsafe_allow_html=True,
        )

        # AI Reasoning
        reasoning_list = analysis.get("reasoning", [])
        reasoning_html = "".join(
            [f"<li style='margin-bottom: 8px;'>{r}</li>" for r in reasoning_list]
        )

        st.markdown(
            f"""
        <div class="ai-summary-box">
            <h4 style="margin-top:0;">✨ Groq Smart Reasoning</h4>
            <div style="color: #C9D1D9; font-size: 0.95rem; margin-bottom: 10px;">
                {analysis.get("summary", "")}
            </div>
            <hr style="border-color: #30363D;">
            <ul style="padding-left: 20px; font-size: 0.9rem; color: #8B949E;">
                {reasoning_html}
            </ul>
        </div>
        """,
            unsafe_allow_html=True,
        )

    # --- Price Chart Section ---
    st.divider()
    st.subheader("📈 Price Chart (6 Months)")

    if chart_data is not None and not chart_data.empty:
        price_chart = create_chart(chart_data, ticker)
        st.plotly_chart(price_chart, use_container_width=True)
    else:
        st.info("Price chart data is loading or unavailable. Please wait or try again.")

    # --- Footer Stats ---
    st.divider()

    # Get target price - prefer analyst target, fallback to AI calculated
    analyst_target = market_data.get("analyst_target_price", 0)
    ai_target = analysis.get("target_price", 0)

    # Use analyst target if available and valid, otherwise use AI target
    if analyst_target and analyst_target > 0:
        target_price = analyst_target
        target_source = "Analyst Consensus"
    else:
        target_price = ai_target if ai_target else 0
        target_source = "AI Calculated"

    c1, c2 = st.columns(2)
    with c1:
        if target_price and target_price > 0:
            curr_price = market_data.get("current_price", 0)
            if curr_price and curr_price > 0:
                upside = ((target_price - curr_price) / curr_price) * 100
                upside_color = "green" if upside >= 0 else "red"
                upside_sign = "+" if upside >= 0 else ""
                st.info(
                    f"🎯 Target Price: **₹{target_price:,.2f}** ({target_source}) | Upside: :{upside_color}[**{upside_sign}{upside:.1f}%**]"
                )
            else:
                st.info(f"🎯 Target Price: **₹{target_price:,.2f}** ({target_source})")
        else:
            st.warning(
                "🎯 Target Price: **Not Available** - Analyst data could not be fetched"
            )
    with c2:
        st.caption(
            "Disclaimer: AI-generated analysis. Not financial advice. Verify with your broker."
        )

else:
    # Empty State
    st.markdown(
        """
    <div style="text-align: center; padding: 100px;">
        <h2>👈 Select a stock to analyze</h2>
        <p style="color: #8B949E;">
            Enter your API keys in the sidebar.<br>
            HyperTracker will search live data using <b>Perplexity</b> and generate insights using <b>Groq</b>.
        </p>
    </div>
    """,
        unsafe_allow_html=True,
    )
