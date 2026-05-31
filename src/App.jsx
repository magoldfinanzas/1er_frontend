import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, LabelList, ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';

// URL base del backend, se lee del archivo .env.local o .env.production según el entorno
const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [activeTab, setActiveTab] = useState('ratio');

  // --- ESTADOS DE DATOS ---
  const [ratioData, setRatioData] = useState([]);
  const [techData, setTechData] = useState([]);
  const [techBaseData, setTechBaseData] = useState([]);
  const [onData, setOnData] = useState([]);
  const [selectedEmisor, setSelectedEmisor] = useState('Todos');
  const [selectedLey, setSelectedLey] = useState('Todas');
  const [loading, setLoading] = useState({ ratio: true, tech: true, base: true, ons: true });

  const colors = ["#38bdf8", "#fbbf24", "#34d399", "#f87171", "#a78bfa", "#f472b6", "#fb923c", "#2dd4bf", "#e879f9", "#818cf8", "#c084fc", "#fb7185", "#9ca3af", "#bef264", "#5eead4"];

  // --- FETCH DE DATOS ---
  useEffect(() => {
    fetch(`${API_URL}/api/ratio`).then(res => res.json()).then(json => { setRatioData(json); setLoading(prev => ({ ...prev, ratio: false })); });
    fetch(`${API_URL}/api/tech`).then(res => res.json()).then(json => { setTechData(json); setLoading(prev => ({ ...prev, tech: false })); });
    fetch(`${API_URL}/api/tech-base100`).then(res => res.json()).then(json => { setTechBaseData(json); setLoading(prev => ({ ...prev, base: false })); });
    fetch(`${API_URL}/api/ons`).then(res => res.json()).then(json => { setOnData(json); setLoading(prev => ({ ...prev, ons: false })); });
  }, []);

  const getTickers = (data) => data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'date') : [];

  // --- COMPONENTE DE GRÁFICO REUTILIZABLE (LINEAS) ---
  const renderLineChart = (data, title, isPercentage = false) => {
    const tickers = getTickers(data);
    return (
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0, color: '#94a3b8' }}>{title}</h3>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={data} margin={{ right: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <YAxis domain={['auto', 'auto']} stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={(v) => isPercentage ? `${v}%` : v} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
            <Legend />
            {tickers.map((ticker, index) => {
              const lineColor = colors[index % colors.length];
              return (
                <Line key={ticker} type="monotone" dataKey={ticker} stroke={lineColor} dot={false} strokeWidth={2}>
                  <LabelList dataKey={ticker} position="right" content={(props) => {
                    const { x, y, index: pointIndex } = props;
                    if (pointIndex === data.length - 1) {
                      return <text x={x + 8} y={y + 4} fill={lineColor} fontSize={12} fontWeight="bold">{ticker}</text>;
                    }
                    return null;
                  }} />
                </Line>
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // --- COMPONENTE TOOLTIP PERSONALIZADO PARA ONs (MINI) ---
  const CustomTooltipON = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid #334155',
          padding: '6px 10px',
          borderRadius: '4px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
          pointerEvents: 'none'
        }}>
          <h4 style={{ color: '#38bdf8', margin: '0 0 4px 0', fontSize: '0.8rem', borderBottom: '1px solid #334155', paddingBottom: '2px', whiteSpace: 'nowrap' }}>
            {data.Ticker}
          </h4>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {Object.entries(data).map(([key, value]) => {
              if (['Ticker', 'df_flujos'].includes(key)) return null;
              return (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: '600', color: '#64748b' }}>{key}:</span>
                  <span style={{ color: '#f8fafc' }}>{value}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // --- COMPONENTE SCATTER PLOT (PARA ONs) ---
  const renderScatterChart = () => {
    // Listas únicas para filtros (Ordenadas, con 'Todos' al principio)
    const emisoresUnicos = [...new Set(onData.map(d => d.emisor || 'Desconocido'))].sort();
    const emisores = ['Todos', ...emisoresUnicos];

    const leyesUnicas = [...new Set(onData.map(d => d.ley || 'S/D'))].sort();
    const leyes = ['Todas', ...leyesUnicas];

    // FILTRADO COMBINADO (Lógica AND)
    const filteredData = onData.filter(d => {
      const emisorDeEsteBono = d.emisor || 'Desconocido';
      const leyDeEsteBono = d.ley || 'S/D';

      const cumpleEmisor = (selectedEmisor === 'Todos' || emisorDeEsteBono === selectedEmisor);
      const cumpleLey = (selectedLey === 'Todas' || leyDeEsteBono === selectedLey);

      return cumpleEmisor && cumpleLey;
    });

    return (
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0, color: '#94a3b8' }}>Análisis de ONs</h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Empresa:</span>
              <select value={selectedEmisor} onChange={(e) => setSelectedEmisor(e.target.value)} style={selectStyle}>
                {emisores.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Ley:</span>
              <select value={selectedLey} onChange={(e) => setSelectedLey(e.target.value)} style={selectStyle}>
                {leyes.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', gap: '15px', fontSize: '0.75rem' }}>
            <span style={{ color: '#ef4444' }}>● Ley NY</span>
            <span style={{ color: '#3b82f6' }}>● Ley AR</span>
            <span style={{ color: '#94a3b8' }}>◆ Bullet</span>
            <span style={{ color: '#94a3b8' }}>● Amortizable</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 'bold' }}>
            Mostrando {filteredData.length} de {onData.length} activos
          </span>
        </div>

        <ResponsiveContainer width="100%" height="80%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis type="number" dataKey="Duration" name="Duration" unit="a" stroke="#94a3b8" label={{ value: 'Duration (Años)', position: 'bottom', fill: '#64748b', fontSize: 12 }} />
            <YAxis type="number" dataKey="TIR" name="TIR" unit="%" stroke="#94a3b8" label={{ value: 'TIR (%)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }} />
            <ZAxis type="category" dataKey="Ticker" name="Ticker" />
            <Tooltip content={<CustomTooltipON />} />
            <Scatter name="ONs" data={filteredData} shape={(props) => {
              const { cx, cy, payload } = props;
              if (payload.Estructura === "Bullet") {
                return <path d={`M${cx},${cy - 8} L${cx + 8},${cy} L${cx},${cy + 8} L${cx - 8},${cy} Z`} fill={payload.ley === "NY" ? "#ef4444" : "#3b82f6"} />;
              }
              return <circle cx={cx} cy={cy} r={6} fill={payload.ley === "NY" ? "#ef4444" : "#3b82f6"} />;
            }}>
              <LabelList dataKey="Ticker" position="top" offset={10} style={{ fill: '#f8fafc', fontSize: 10, fontWeight: 'bold' }} />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // --- ESTILOS ---
  const containerStyle = { width: '100%', minHeight: '100vh', padding: '40px', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center' };
  const navStyle = { display: 'flex', gap: '10px', marginBottom: '30px', backgroundColor: '#1e293b', padding: '8px', borderRadius: '12px' };
  const buttonStyle = (tab) => ({ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', backgroundColor: activeTab === tab ? '#38bdf8' : 'transparent', color: activeTab === tab ? '#0f172a' : '#94a3b8' });
  const cardStyle = { width: '100%', maxWidth: '1100px', height: '600px', backgroundColor: '#1e293b', borderRadius: '16px', padding: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' };

  const selectStyle = {
    backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155',
    padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', outline: 'none', cursor: 'pointer'
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ marginBottom: '10px', color: '#38bdf8' }}>Terminal Financiera Pro</h1>

      <div style={navStyle}>
        <button style={buttonStyle('ratio')} onClick={() => setActiveTab('ratio')}>Ratio GGAL/YPF</button>
        <button style={buttonStyle('tech')} onClick={() => setActiveTab('tech')}>Precios Tech</button>
        <button style={buttonStyle('base')} onClick={() => setActiveTab('base')}>Comparativa %</button>
        <button style={buttonStyle('ons')} onClick={() => setActiveTab('ons')}>ONs (TIR vs Dur)</button>
      </div>

      {activeTab === 'ratio' && (loading.ratio ? <p>Cargando...</p> : renderLineChart(ratioData, "Análisis de Ratio"))}
      {activeTab === 'tech' && (loading.tech ? <p>Cargando...</p> : renderLineChart(techData, "Precios de Cierre (USD)"))}
      {activeTab === 'base' && (loading.base ? <p>Cargando...</p> : renderLineChart(techBaseData, "Rendimiento Relativo (Base 100)", true))}
      {activeTab === 'ons' && (loading.ons ? <p>Cargando ONs...</p> : renderScatterChart())}

      <footer style={{ marginTop: '30px', color: '#475569', fontSize: '0.8rem' }}>
        Backend Activo • Puerto 8000 • Datos de data912.com
      </footer>
    </div>
  );
}

export default App;
