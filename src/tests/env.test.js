describe('Environment Variables Test', () => {
  it('should load the test environment variables correctly', () => {
    expect(process.env.NODE_ENV).toBe('test');
    
    expect(process.env.MONGO_URI).toContain('sass_test_db');
    
    expect(process.env.PORT).toBe('5001');
  });
});