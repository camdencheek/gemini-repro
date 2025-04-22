import sys
import math

def main():
    # Check if the correct number of arguments is provided
    if len(sys.argv) != 2:
        print("Usage: python factorial.py <number>")
        sys.exit(1)

    # Try to convert the command line argument to an integer
    try:
        number = int(sys.argv[1])
    except ValueError:
        print("Error: Input must be an integer.")
        sys.exit(1)

    # Check if the number is non-negative
    if number < 0:
        print("Error: Factorial is not defined for negative numbers.")
        sys.exit(1)

    # Calculate the factorial and handle potential errors
    try:
        result = math.factorial(number)
        print(f"The factorial of {number} is {result}")
    except OverflowError:
        # Handle cases where the result is too large to be represented
        print(f"Error: Result for factorial({number}) is too large to compute.")
        sys.exit(1)
    except Exception as e:
        # Catch any other potential errors from math.factorial
        print(f"An unexpected error occurred during calculation: {e}")
        sys.exit(1)

    # Exit successfully
    sys.exit(0)

if __name__ == "__main__":
    main()
