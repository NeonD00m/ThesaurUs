import os
import sys
import re
import string

# Ensure the root of the project is in the python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import clean_tokens, get_frequencies

def enable_windows_ansi():
    """Enables ANSI escape sequences in Windows Command Prompt/PowerShell."""
    if os.name == 'nt':
        try:
            import ctypes
            kernel32 = ctypes.windll.kernel32
            kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)
        except Exception:
            pass

def get_gradient_color(count, min_count, max_count):
    """
    Computes RGB components for a continuous gradient from:
    Yellow (255, 255, 0) -> Red (255, 0, 0)
    
    Highest ranked (max_count) -> Red
    Lowest ranked (min_count) -> Yellow
    """
    if max_count == min_count:
        t = 1.0
    else:
        t = (count - min_count) / (max_count - min_count)
    
    # Red is always 255
    r = 255
    # Green goes from 255 (when t=0, Yellow) to 0 (when t=1, Red)
    g = int(255 * (1.0 - t))
    b = 0
    return r, g, b

def format_colored_text(text, overused_words, highlight_all=False):
    if not overused_words:
        # If no overused words, return either all green (if highlight_all) or plain text
        if highlight_all:
            tokens_with_delimiters = re.split(r'(\w+)', text)
            colored_tokens = []
            for token in tokens_with_delimiters:
                if re.match(r'^\w+$', token):
                    colored_tokens.append(f"\033[38;2;120;220;120m{token}\033[0m")
                else:
                    colored_tokens.append(token)
            return "".join(colored_tokens)
        return text
    
    # Create mapping from word to count
    overused_map = {word: count for word, count in overused_words}
    counts = [count for _, count in overused_words]
    min_count = min(counts)
    max_count = max(counts)
    
    # Split text using regex to keep words and non-words (punctuation/spaces)
    tokens_with_delimiters = re.split(r'(\w+)', text)
    colored_tokens = []
    
    for token in tokens_with_delimiters:
        if re.match(r'^\w+$', token):
            norm = token.lower()
            if norm in overused_map:
                count = overused_map[norm]
                r, g, b = get_gradient_color(count, min_count, max_count)
                # Apply ANSI truecolor escape sequence (Yellow -> Red)
                colored_token = f"\033[38;2;{r};{g};{b}m{token}\033[0m"
                colored_tokens.append(colored_token)
            else:
                if highlight_all:
                    # Soft green for lack of overuse
                    colored_token = f"\033[38;2;120;220;120m{token}\033[0m"
                    colored_tokens.append(colored_token)
                else:
                    colored_tokens.append(token)
        else:
            # Punctuation/spacing
            colored_tokens.append(token)
            
    return "".join(colored_tokens)

def naive_overuse_custom(counts, threshold_pct):
    """
    Naive overuse detection based on custom threshold percentage.
    Filters counts strictly based on: count > 1 and count >= (len(counts) * threshold_pct)
    """
    threshold = len(counts) * threshold_pct
    ranking = []
    for word, count in counts.items():
        if count > 1 and count >= threshold:
            i, ranked = 0, len(ranking)
            while i < ranked and count < ranking[i][1]:
                i += 1
            ranking.insert(i, (word, count))
    return ranking, threshold

def main():
    enable_windows_ansi()
    
    default_paragraph = (
        "The quick brown fox jumps over the lazy dog. The dog was not very lazy, "
        "but the dog was sleepy. Sleepy dogs are often lazy because they are tired. "
        "The fox, however, was not sleepy or tired; the fox was very energetic and fast. "
        "The energetic fox wanted to play, but the lazy dog just wanted to sleep."
    )
    
    print("=" * 65)
    print("               THESAURUS - NAIVE OVERUSE DEMO")
    print("=" * 65)
    print("\nDefault Paragraph:")
    print("-" * 65)
    print(default_paragraph)
    print("-" * 65)
    
    # 1. Paragraph source selection
    print("\nChoose an option:")
    print("1) Use the default paragraph")
    print("2) Paste/input a custom paragraph")
    
    choice = ""
    while choice not in ("1", "2"):
        choice = input("Enter choice (1 or 2): ").strip()
        
    if choice == "2":
        print("\nPlease paste your text below.")
        print("To finish, type 'EOF' on a new line and press Enter:")
        print("-" * 65)
        lines = []
        while True:
            try:
                line = input()
                if line.strip() == "EOF":
                    break
                lines.append(line)
            except EOFError:
                break
        text = "\n".join(lines)
        if not text.strip():
            print("Error: No text entered. Reverting to default paragraph.")
            text = default_paragraph
    else:
        text = default_paragraph
        
    # 2. Threshold selection
    print("\nConfigure Overuse Threshold:")
    print("Default is 5% (0.05). Increasing this percentage minimizes the overused words list.")
    pct_input = input("Enter threshold percentage (e.g. 5 for 5%, 10 for 10%) or press Enter for default: ").strip()
    
    try:
        if pct_input:
            threshold_pct = float(pct_input) / 100.0
        else:
            threshold_pct = 0.05
    except ValueError:
        print("Invalid input. Using default 5% threshold.")
        threshold_pct = 0.05
        
    # Process text using tokenization
    tokens = clean_tokens(text)
    frequencies = get_frequencies(tokens)
    overused_words, threshold_val = naive_overuse_custom(frequencies, threshold_pct)
    
    # Calculate minimum occurrences required to meet threshold
    import math
    min_occ_req = max(2, math.ceil(threshold_val))
    
    print("\n" + "=" * 65)
    print("                           RESULTS")
    print("=" * 65)
    print(f"Unique words: {len(frequencies)}")
    print(f"Threshold limit: {threshold_val:.2f} (words must appear >= {min_occ_req} times to qualify)")
    
    # Display Display 1: Minimized (Only Overused Words highlighted)
    print("\n[Display 1] Highlighted Text (Only Overused Words Colored):")
    print("-" * 65)
    print(format_colored_text(text, overused_words, highlight_all=False))
    print("-" * 65)
    
    # Display Display 2: Full highlighting (Overused colored, safe words colored green)
    print("\n[Display 2] Full Text Analysis (Green = Safe, Yellow->Red = Overused):")
    print("-" * 65)
    print(format_colored_text(text, overused_words, highlight_all=True))
    print("-" * 65)
    
    # Print the table of overused words with matching colors
    if not overused_words:
        print("\nNo overused words detected above the threshold!")
        print("=" * 65)
        return
        
    print("\nOverused Words Ranking (Gradient: Yellow -> Red):")
    print(f"{'Word':<15} | {'Count':<6} | {'Status':<15}")
    print("-" * 42)
    
    counts = [c for _, c in overused_words]
    min_count = min(counts)
    max_count = max(counts)
    
    for word, count in overused_words:
        r, g, b = get_gradient_color(count, min_count, max_count)
        colored_word = f"\033[38;2;{r};{g};{b}m{word:<15}\033[0m"
        
        if count == max_count:
            status = "Most Overused (Red)"
        elif count == min_count:
            status = "Least Overused (Yellow)"
        else:
            status = "Moderate (Orange)"
            
        print(f"{colored_word} | {count:<6} | {status}")
    print("=" * 65)

if __name__ == "__main__":
    main()
