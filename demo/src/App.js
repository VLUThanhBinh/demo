import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [suppliers, setSuppliers] = useState([]);
  const [supplier, setSupplier] = useState(null);
  const [supOpen, setSupOpen] = useState(false);
  const [currentSeq, setCurrentSeq] = useState(1);

  const [record, setRecord] = useState({
    id: '',
    weight: '',
    classification: 'I',
    defects: { haoHut10: false, haoHut20: false },
    attributes: { matTo: true, muoi: false, chay: false, dat: false },
    agreeFinish: false
  });

  const [saved, setSaved] = useState(false);

  const formatSeq = (n, total) => {
    const digits = total ? String(total).length : 2;
    return String(n).padStart(digits, '0');
  };

  const hasWeight = Number(record.weight) > 0;

  useEffect(() => {
    axios.get('http://localhost:4000/api/suppliers')
      .then(r => {
        const list = (r.data || []).map((s, i) => {
          const totals = [10, 12, 14];
          return { ...s, total: totals[i] ?? s.total };
        });

        setSuppliers(list);

        if (list.length) {
          const first = list[0];
          setSupplier(first);
          setCurrentSeq(1);
          setRecord(prev => ({
            ...prev,
            id: formatSeq(1, first.total),
            weight: prev.weight || first.defaultWeight || ''
          }));
        }
      })
      .catch(err => console.error(err));
  }, []);

  function toggleSupList() {
    setSupOpen(s => !s);
  }

  function selectSupplier(s) {
    setSupplier(s);
    setCurrentSeq(1);
    setRecord(prev => ({
      ...prev,
      id: formatSeq(1, s.total),
      weight: prev.weight || s.defaultWeight || ''
    }));
    setSupOpen(false);
  }

  function updateRecord(key, value) {
    setRecord(prev => ({ ...prev, [key]: value }));
  }

  function toggleAttr(key) {
    setRecord(prev => ({
      ...prev,
      attributes: { ...prev.attributes, [key]: !prev.attributes[key] }
    }));
  }

  function setClassification(val) {
    setRecord(prev => ({ ...prev, classification: val }));
  }

  function toggleDefect(key) {
    setRecord(prev => ({
      ...prev,
      defects: { ...prev.defects, [key]: !prev.defects[key] }
    }));
  }

  function toggleAgree() {
    setRecord(prev => ({ ...prev, agreeFinish: !prev.agreeFinish }));
  }

  async function handleSave() {
    if (!supplier) return alert('Chưa chọn nhà cung cấp');
    if (!hasWeight) return alert('Nhập khối lượng trước khi lưu');

    const payload = {
      supplierId: supplier?.id || null,
      recordId: record.id,
      weight: Number(record.weight),
      classification: record.classification,
      attributes: record.attributes,
      defects: record.defects
    };

    try {
      await axios.post('http://localhost:4000/api/records', payload);

      setSaved(true);
      setTimeout(() => setSaved(false), 1400);

      const next = currentSeq + 1;
      const max = Number(supplier.total || Number.MAX_SAFE_INTEGER);

      if (next <= max) {
        setCurrentSeq(next);
        setRecord(prev => ({
          ...prev,
          id: formatSeq(next, supplier.total),
          weight: ''
        }));
      } else {
        setRecord(prev => ({ ...prev, weight: '' }));
        setCurrentSeq(max);
      }
    } catch (err) {
      console.error(err);
      alert('Lưu thất bại');
    }
  }

  function handleFinish() {
    if (!supplier) return alert('Chưa chọn nhà cung cấp');

    const enteredSaved = currentSeq - 1;
    const entered = enteredSaved + (hasWeight ? 1 : 0);
    const total = Number(supplier.total || 0);

    if (entered < total) {
      return alert(`Chưa nhập đủ số lượng cá: đã nhập ${entered}/${total}.`);
    }
    if (!record.agreeFinish) return alert('Bạn cần tích "Tôi đồng ý kết thúc" trước khi kết thúc.');
    alert('Kết thúc thành công');
  }

  return (
    <div className="app-root">
      <div className="frame">
        <div className="frame-header">
          <div className="supplier">
            <div className="supplier-box">
              <div className="supplier-title-row">
                <button className={`sup-toggle ${supOpen ? 'open' : ''}`} onClick={toggleSupList}>
                  <span className="caret" />
                </button>
                <div className="supplier-title">NHÀ CUNG CẤP</div>
              </div>

              <div className="supplier-info">
                {supOpen && (
                  <div className="supplier-dropdown" role="list">
                    {suppliers.map(s => (
                      <div key={s.id} className="supplier-item" onClick={() => selectSupplier(s)}>
                        <div className="si-name">{s.name} <span className="si-count">({s.total})</span></div>
                      </div>
                    ))}
                  </div>
                )}

                <label className="sup-row">
                  <span className="sup-label">Tên</span>
                  <input className="sup-input" value={supplier ? (supplier.name.toUpperCase() + `(${supplier.total})`) : ''} readOnly />
                </label>

                <label className="sup-row">
                  <span className="sup-label">Biển số xe</span>
                  <input className="sup-input" value={supplier?.plate || ''} readOnly />
                </label>

                <label className="sup-row">
                  <span className="sup-label">Tổng số lượng</span>
                  <input className="sup-input small" type="number" value={supplier?.total || ''} readOnly />
                </label>

                <label className="sup-row">
                  <span className="sup-label">Tổng khối lượng (kg)</span>
                  <input className="sup-input small" type="number" step="0.1" value={supplier?.totalWeight || ''} readOnly />
                </label>
              </div>
            </div>
          </div>

          <div className="actions">
            <button className="btn btn-save large" onClick={handleSave}>Lưu</button>
          </div>
        </div>

        <div className="card">
          <div className="card-top">
            <div className="record-id">
              <div className="label">Số hiệu</div>
              <input className="record-input" type="text" value={record.id} readOnly />
            </div>

            <div className="record-weight">
              <div className="label">Khối lượng</div>
              <input
                className="record-input"
                type="number"
                step="0.1"
                value={record.weight}
                onChange={e => updateRecord('weight', e.target.value)}
              />
              <span className="kg-label">kg</span>
            </div>
          </div>

          <div className="card-body">
            <div className="panel classification">
              <div className="panel-title">Phân loại</div>
              <div className="class-grid">
                {['I', 'II'].map(type => (
                  <div
                    key={type}
                    className={`class-item ${record.classification === type ? 'active' : ''}`}
                    onClick={() => setClassification(type)}
                  >
                    <div className="class-label">Loại {type}</div>
                    <div className={`check-box ${record.classification === type ? 'checked' : ''}`}>
                      {record.classification === type ? '✔' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel defects">
              <div className="panel-title">Hao hụt</div>
              <div className="def-grid">
                {[
                  { key: 'haoHut10', label: '-10%' },
                  { key: 'haoHut20', label: '-20%' }
                ].map(def => (
                  <div
                    key={def.key}
                    className={`def-item ${record.defects[def.key] ? 'checked' : ''}`}
                    onClick={() => toggleDefect(def.key)}
                  >
                    <div className="def-label">{def.label}</div>
                    <div className={`check-box ${record.defects[def.key] ? 'checked' : ''}`}>
                      {record.defects[def.key] ? '✔' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel attributes">
              <div className="panel-title">Tình trạng</div>
              <div className="attr-grid">
                {[
                  { key: 'matTo', label: 'Mắt to' },
                  { key: 'muoi', label: 'Muối' },
                  { key: 'chay', label: 'Cháy' },
                  { key: 'dat', label: 'Đạt' }
                ].map(attr => (
                  <div key={attr.key} className="attr-item" onClick={() => toggleAttr(attr.key)}>
                    <div className={`square ${record.attributes[attr.key] ? 'on' : ''}`}>
                      {record.attributes[attr.key] ? '✔' : ''}
                    </div>
                    <div className="attr-label">{attr.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card-footer">
            <label className="agree">
              <input type="checkbox" checked={record.agreeFinish} onChange={toggleAgree} />
              Tôi đồng ý kết thúc
            </label>

            <div className="footer-actions">
              {!record.weight || record.weight <= 0 ? (
                <div className="warning">*Chưa nhập đủ số lượng cá</div>
              ) : (
                <div className="warning-placeholder" />
              )}
              <button className="btn btn-end" onClick={handleFinish}>Kết thúc</button>
            </div>
          </div>
        </div>

        {saved && <div className="toast">Đã lưu</div>}
      </div>
    </div>
  );
}

export default App;
