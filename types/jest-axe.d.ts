declare module 'jest-axe' {
  interface AxeResults {
    violations: any[]
  }

  export function axe(element: Element, options?: any): Promise<AxeResults>
  export function toHaveNoViolations(results: AxeResults): any
}

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R
    }
  }
}
