"""
Test script for multimodal ML service functionality
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from multimodal_service import (
    get_available_models,
    get_model_info,
    extract_signal_from_text,
    estimate_confidence,
    AVAILABLE_MODELS,
    ModelFamily,
    ModelProvider
)

def test_model_configuration():
    """Test that models are configured correctly"""
    print("Testing model configuration...")
    
    models = get_available_models()
    assert len(models) > 0, "No models configured"
    
    # Check model families
    families = set(m['family'] for m in models)
    expected_families = {ModelFamily.LLAMA, ModelFamily.MISTRAL, ModelFamily.GEMMA, ModelFamily.QWEN}
    assert families == expected_families, f"Missing families. Expected {expected_families}, got {families}"
    
    # Check vision models exist
    vision_models = [m for m in models if m['vision']]
    assert len(vision_models) >= 2, "Should have at least 2 vision models"
    
    print(f"✓ Found {len(models)} models across {len(families)} families")
    print(f"✓ Text models: {len([m for m in models if not m['vision']])}")
    print(f"✓ Vision models: {len(vision_models)}")


def test_model_info():
    """Test getting individual model info"""
    print("\nTesting model info retrieval...")
    
    # Test valid model
    info = get_model_info("llama-3.2-3b")
    assert info is not None, "Failed to get model info"
    assert info['family'] == ModelFamily.LLAMA, "Wrong family"
    assert info['vision'] == False, "Wrong vision capability"
    
    # Test vision model
    vision_info = get_model_info("llama-3.2-vision")
    assert vision_info is not None, "Failed to get vision model info"
    assert vision_info['vision'] == True, "Vision model should support vision"
    
    # Test invalid model
    invalid = get_model_info("nonexistent-model")
    assert invalid is None, "Should return None for invalid model"
    
    print("✓ Model info retrieval works correctly")


def test_signal_extraction():
    """Test signal extraction from text"""
    print("\nTesting signal extraction...")
    
    # Test bullish text
    bullish = "The stock shows strong bullish momentum with a clear breakout above resistance. Recommend to buy."
    signal = extract_signal_from_text(bullish)
    assert signal == "BUY", f"Expected BUY, got {signal}"
    
    # Test bearish text
    bearish = "Bearish pattern emerging with breakdown below support. Consider selling positions."
    signal = extract_signal_from_text(bearish)
    assert signal == "SELL", f"Expected SELL, got {signal}"
    
    # Test neutral text
    neutral = "The market is consolidating with mixed signals."
    signal = extract_signal_from_text(neutral)
    assert signal == "NEUTRAL", f"Expected NEUTRAL, got {signal}"
    
    print("✓ Signal extraction works correctly")


def test_confidence_estimation():
    """Test confidence score estimation"""
    print("\nTesting confidence estimation...")
    
    # High confidence text
    strong_text = "Definitely a clear and strong uptrend confirmed by all indicators."
    conf = estimate_confidence(strong_text)
    assert conf > 0.7, f"Expected high confidence, got {conf}"
    
    # Low confidence text
    weak_text = "Might be uncertain, could possibly change, unclear direction."
    conf = estimate_confidence(weak_text)
    assert conf < 0.6, f"Expected low confidence, got {conf}"
    
    # Confidence should be clamped
    assert 0.3 <= conf <= 0.95, f"Confidence {conf} outside valid range"
    
    print("✓ Confidence estimation works correctly")


def test_model_providers():
    """Test provider distribution"""
    print("\nTesting model providers...")
    
    ollama_models = [m for m in AVAILABLE_MODELS.values() if m['provider'] == ModelProvider.OLLAMA]
    groq_models = [m for m in AVAILABLE_MODELS.values() if m['provider'] == ModelProvider.GROQ]
    
    assert len(ollama_models) > 0, "Should have Ollama models"
    print(f"✓ {len(ollama_models)} Ollama models configured")
    print(f"✓ {len(groq_models)} Groq models configured")


def main():
    """Run all tests"""
    print("=" * 60)
    print("Multimodal ML Service Tests")
    print("=" * 60)
    
    try:
        test_model_configuration()
        test_model_info()
        test_signal_extraction()
        test_confidence_estimation()
        test_model_providers()
        
        print("\n" + "=" * 60)
        print("✓ ALL TESTS PASSED")
        print("=" * 60)
        return 0
        
    except AssertionError as e:
        print(f"\n✗ TEST FAILED: {e}")
        return 1
    except Exception as e:
        print(f"\n✗ UNEXPECTED ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
