import Link from 'next/link';

export default function About() {
  return (
      <div
            style={{
                    padding: '2rem',
                            minHeight: '100vh',
                                    background: "url('/background.jpg') no-repeat center center fixed",
                                            backgroundSize: 'cover',
                                                    display: 'flex',
                                                            justifyContent: 'center',
                                                                    alignItems: 'center',
                                                                          }}
                                                                              >
                                                                                    <div
                                                                                            style={{
                                                                                                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                                                                                                padding: '2rem',
                                                                                                                          borderRadius: '16px',
                                                                                                                                    color: 'white',
                                                                                                                                              maxWidth: '600px',
                                                                                                                                                        width: '100%',
                                                                                                                                                                  textAlign: 'center',
                                                                                                                                                                          }}
                                                                                                                                                                                >
                                                                                                                                                                                        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>About This Tool</h1>
                                                                                                                                                                                                <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                                                                                                                                                                                                          This tool analyzes Bitcoin’s price action using all-time highs (ATH), all-time lows (ATL), and EMA70 gaps to generate bullish or bearish trading signals.
                                                                                                                                                                                                                  </p>
                                                                                                                                                                                                                          <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                                                                                                                                                                                                                                    It is designed for crypto traders seeking an edge in volatile markets by leveraging visual and data-driven patterns to identify strategic entry points, stop loss zones, and profit targets.
                                                                                                                                                                                                                                            </p>
                                                                                                                                                                                                                                                    <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
                                                                                                                                                                                                                                                              Created by an independent developer using React and Chart.js, this project is community-focused and open for feedback and contributions.
                                                                                                                                                                                                                                                                      </p>

                                                                                                                                                                                                                                                                              <div style={{ marginTop: '2rem' }}>
                                                                                                                                                                                                                                                                                        <Link href="/">
                                                                                                                                                                                                                                                                                                    <a style={{ color: '#4fc3f7', textDecoration: 'underline' }}>Back to Home</a>
                                                                                                                                                                                                                                                                                                              </Link>
                                                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                                                                                                  );
                                                                                                                                                                                                                                                                                                                                  }