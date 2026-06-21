describe('ConsoleEmailStrategy', () => {
  let ConsoleEmailStrategy;
  let strategy;

  beforeAll(() => {
    ConsoleEmailStrategy = require('../../lib/strategies/email/consoleEmail.strategy');
  });

  beforeEach(() => {
    strategy = new ConsoleEmailStrategy();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should log email to console', async () => {
    const result = await strategy.sendEmail({
      to: 'user@test.com',
      subject: 'Test',
      text: 'Hello',
    });

    expect(result.success).toBe(true);
    expect(result.logged).toBe(true);
    expect(console.log).toHaveBeenCalled();
  });
});

describe('StubEmailStrategy', () => {
  let StubEmailStrategy;
  let strategy;

  beforeAll(() => {
    StubEmailStrategy = require('../../lib/strategies/email/stubEmail.strategy');
  });

  beforeEach(() => {
    strategy = new StubEmailStrategy();
  });

  it('should throw when called', async () => {
    await expect(strategy.sendEmail({ to: 'test@test.com', subject: 'x', text: 'x' })).rejects.toThrow();
  });
});

describe('SmtpEmailStrategy', () => {
  let SmtpEmailStrategy;
  let strategy;

  beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    SmtpEmailStrategy = require('../../lib/strategies/email/smtpEmail.strategy');
  });

  beforeEach(() => {
    strategy = new SmtpEmailStrategy();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should fall back to console log when SMTP not configured', async () => {
    const result = await strategy.sendEmail({
      to: 'user@test.com',
      subject: 'Fallback Test',
      text: 'No SMTP configured',
    });

    expect(result.success).toBe(true);
    expect(result.fallback).toBe(true);
  });
});
