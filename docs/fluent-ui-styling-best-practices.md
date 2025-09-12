# Fluent UI Styling Best Practices for Support Pilot

## The mergeClasses Issue

When using Fluent UI v9 with `makeStyles`, **never use string concatenation** to combine CSS classes. Fluent UI v9 uses Griffel, which generates atomic classes that start with "___". String concatenation can cause these atomic classes to be improperly merged, leading to runtime errors like:

```
mergeClasses(): a passed string contains multiple identifiers of atomic classes (classes that start with "___")
```

## ❌ Wrong Patterns

### String Concatenation
```tsx
// DON'T DO THIS
const className = `${styles.base} ${customClass || ""}`;
const className = `${styles.button} ${isActive ? styles.active : ""}`;
```

### Array Join
```tsx
// DON'T DO THIS
const className = [styles.base, customClass, isActive && styles.active]
  .filter(Boolean)
  .join(" ");
```

### Template Literals
```tsx
// DON'T DO THIS
<div className={`${styles.container} ${additionalClass}`}>
```

## ✅ Correct Pattern

### Use mergeClasses Utility
```tsx
import { mergeClasses } from "@fluentui/react-components";

// Simple merge
const className = mergeClasses(styles.base, customClass);

// Conditional classes
const className = mergeClasses(
  styles.button,
  isActive && styles.active,
  customClass
);

// Multiple conditions
const className = mergeClasses(
  styles.base,
  isDisabled && styles.disabled,
  isSelected && styles.selected,
  customClass
);
```

## Implementation Examples

### Basic Component with className prop
```tsx
import { mergeClasses } from "@fluentui/react-components";

interface ComponentProps {
  className?: string;
}

export const Component: React.FC<ComponentProps> = ({ className }) => {
  const styles = useComponentStyles();
  
  return (
    <div className={mergeClasses(styles.root, className)}>
      Content
    </div>
  );
};
```

### Component with Multiple Conditional Classes
```tsx
interface ButtonProps {
  variant?: "primary" | "secondary";
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = "primary", 
  disabled = false, 
  className 
}) => {
  const styles = useButtonStyles();
  
  return (
    <button
      className={mergeClasses(
        styles.button,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        disabled && styles.disabled,
        className
      )}
      disabled={disabled}
    >
      Click me
    </button>
  );
};
```

## Key Benefits of mergeClasses

1. **Atomic Class Safety**: Properly handles Griffel's atomic classes
2. **Automatic Deduplication**: Removes duplicate classes automatically
3. **Type Safety**: Works with TypeScript for better development experience
4. **Performance**: Optimized for Fluent UI's CSS-in-JS system
5. **Null/Undefined Handling**: Safely ignores falsy values

## Additional Tips

1. **Always import mergeClasses** when your component accepts a `className` prop
2. **Use conditional expressions** inside mergeClasses instead of ternary operators outside
3. **Order matters**: Put base styles first, then modifiers, then custom classes
4. **Avoid empty strings**: mergeClasses handles undefined/null gracefully

## Fixed Components in This Project

- ✅ `UserMessageCard.tsx` - Replaced string concatenation with mergeClasses
- ✅ `MessageInputField.tsx` - Replaced array.join() with mergeClasses  
- ✅ `AttachFileButton.tsx` - Replaced conditional string concatenation with mergeClasses

## References

- [Fluent UI React v9 Documentation](https://react.fluentui.dev/)
- [Griffel CSS-in-JS Library](https://griffel.js.org/)
- [Microsoft Fluent UI Best Practices](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/code-components-best-practices)