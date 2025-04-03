import React, { useEffect, useState } from "react";
import Tree from "react-d3-tree";
import axios from "axios";

const DerivationTreeGenerator = () => {
  const [terminalSymbols, setTerminalSymbols] = useState([]);
  const [nonTerminalSymbols, setNonTerminalSymbols] = useState([]);
  const [productionRules, setProductionRules] = useState([]);
  const [axiomaticSymbol, setAxiomaticSymbol] = useState("");
  const [levels, setLevels] = useState("");

  const [word, setWord] = useState("");
  const [steps, setSteps] = useState([]);
  const [productionsPartials, setProductionsPartials] = useState([]);
  const [axiomaticSymbolPartial, setAxiomaticSymbolPartial] = useState("");

  const [data, setData] = useState(null);

  const isFormValid = () => {
    return (
      terminalSymbols.length > 0 &&
      nonTerminalSymbols.length > 0 &&
      productionRules.length > 0 &&
      levels.trim() !== ""
    );
  };

  const addElement = (value, list, setList, otherList) => {
    const trimmedValue = value.trim();
    if (
      trimmedValue &&
      !list.includes(trimmedValue) &&
      !otherList.includes(trimmedValue)
    ) {
      setList([...list, trimmedValue]);
    } else if (otherList.includes(trimmedValue)) {
      alert(
        "El símbolo ya está en la otra lista. Debe ser terminal o no terminal, pero no ambos."
      );
    }
  };

  const removeElement = (value, list, setList) => {
    setList(list.filter((item) => item !== value));
  };

  const addProductionRule = (input) => {
    const value = input.trim();
    const match = value.match(/^(.+)->(.+)$/);
    if (!match) {
      alert("Formato incorrecto. Asegúrate de incluir '->' en la regla.");
      return;
    }
    const nonTerminalSymbol = match[1].trim();
    const symbolsProduced = match[2].trim().split("|");
    if (!nonTerminalSymbols.includes(nonTerminalSymbol)) {
      alert(
        `El símbolo no terminal "${nonTerminalSymbol}" no está en la lista de símbolos no terminales.`
      );
      return;
    }
    const newProductionRules = symbolsProduced
      .map((symbolProduced) => {
        const symbols = symbolProduced.trim().split("");
        const nonTerminalCount = symbols.filter((s) =>
          nonTerminalSymbols.includes(s)
        ).length;
        if (nonTerminalCount > 1) {
          alert(
            `La producción "${symbolProduced}" tiene más de un símbolo no terminal. Solo se permite uno.`
          );
          return null;
        }
        const invalidSymbols = symbols.filter(
          (s) => !terminalSymbols.includes(s) && !nonTerminalSymbols.includes(s)
        );
        if (invalidSymbols.length > 0) {
          alert(
            `Los siguientes símbolos no están en las listas de terminales o no terminales: ${invalidSymbols.join(
              ", "
            )}`
          );
          return null;
        }
        return { nonTerminalSymbol, symbolProduced: symbolProduced.trim() };
      })
      .filter(Boolean);
    if (newProductionRules.length > 0) {
      setProductionRules([...productionRules, ...newProductionRules]);
    }
  };

  const removeProductionRule = (nonTerminalSymbol, symbolProduced) => {
    setProductionRules(
      productionRules.filter(
        (productionRule) =>
          !(
            productionRule.nonTerminalSymbol === nonTerminalSymbol &&
            productionRule.symbolProduced === symbolProduced
          )
      )
    );
  };

  const sendGrammarData = async () => {
    if (!isFormValid()) return;
    const requestData = {
      terminalSymbols: terminalSymbols,
      nonTerminalSymbols: nonTerminalSymbols,
      axiomaticSymbol: axiomaticSymbol,
      productionRules: productionRules,
      levels: levels,
    };
    try {
      const response = await axios.post(
        "http://localhost:8080/formal-grammar/cqc",
        requestData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      setData(response.data);
    } catch (error) {
      console.error("Error al enviar los datos:", error);
    }
  };

  function checkWord() {
    fetch("http://localhost:8080/formal-grammar/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ word: word }),
    })
      .then((response) => response.json())
      .then((data) => {
        setProductionsPartials(data.derivativeProducts);
        setSteps(data.derivationSteps);
        setAxiomaticSymbolPartial(data.axiomaticSymbol);
      })
      .catch((error) => alert("Error: " + error.message));
  }

  const handleChange = (e) => {
    const value = e.target.value;

    if (!/\s/.test(value)) {
      setWord(value);
    }
  };

  useEffect(() => {
    checkWord();
  }, [word]);

  useEffect(() => {
    if (nonTerminalSymbols.length > 0) {
      setAxiomaticSymbol(nonTerminalSymbols[0]);
    } else {
      setAxiomaticSymbol("");
    }
  }, [nonTerminalSymbols]);

  return (
    <div className="main_panel">
      <div className="left_panel">
        <div className="set">
          <h1>Programando un Árbol</h1>
        </div>
        <div className="set">
          <h3>Símbolos Terminales:</h3>
          <input
            type="text"
            onKeyDown={(e) => {
              if (e.key === " ") e.preventDefault();
              if (e.key === "Enter") {
                addElement(
                  e.target.value,
                  terminalSymbols,
                  setTerminalSymbols,
                  nonTerminalSymbols
                );
                e.target.value = "";
              }
            }}
          />
          <div className="set_tags">
            {terminalSymbols.map((t) => (
              <span
                className="tags"
                key={t}
                onDoubleClick={() =>
                  removeElement(t, terminalSymbols, setTerminalSymbols)
                }
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="set">
          <h3>Símbolos No Terminales:</h3>
          <input
            type="text"
            onKeyDown={(e) => {
              if (e.key === " ") e.preventDefault();
              if (e.key === "Enter") {
                addElement(
                  e.target.value,
                  nonTerminalSymbols,
                  setNonTerminalSymbols,
                  terminalSymbols
                );
                e.target.value = "";
              }
            }}
          />
          <div className="set_tags">
            {nonTerminalSymbols.map((v) => (
              <span
                className="tags"
                key={v}
                onDoubleClick={() =>
                  removeElement(v, nonTerminalSymbols, setNonTerminalSymbols)
                }
              >
                {v}
              </span>
            ))}
          </div>
        </div>
        <div className="set">
          <h3>Símbolo Axiomático:</h3>
          <select
            value={axiomaticSymbol}
            onChange={(e) => setAxiomaticSymbol(e.target.value)}
          >
            {nonTerminalSymbols.map((symbol) => (
              <option key={symbol} value={symbol}>
                {symbol}
              </option>
            ))}
          </select>
        </div>
        <div className="set">
          <h3>Reglas de Producción (Formato: A-{">"}B|C):</h3>
          <input
            type="text"
            onKeyDown={(e) => {
              if (e.key === " ") e.preventDefault();
              if (e.key === "Enter") {
                addProductionRule(e.target.value);
                e.target.value = "";
              }
            }}
            onChange={(e) =>
              (e.target.value = e.target.value.replace(/\s/g, ""))
            }
          />
          <div className="set_tags">
            {productionRules.map(
              ({ nonTerminalSymbol, symbolProduced }, index) => (
                <div
                  className="production_tags"
                  key={index}
                  onDoubleClick={() =>
                    removeProductionRule(nonTerminalSymbol, symbolProduced)
                  }
                >
                  {nonTerminalSymbol} → {symbolProduced}
                </div>
              )
            )}
          </div>
        </div>
        <div className="set">
          <h3>Niveles de Expansión:</h3>
          <input
            type="number"
            value={levels}
            onChange={(e) => setLevels(e.target.value.replace(/\s/g, ""))}
            onKeyDown={(e) => e.key === " " && e.preventDefault()}
          />
        </div>
        <div className="set">
          <button
            onClick={sendGrammarData}
            className="save_changes"
            disabled={!isFormValid()}
          >
            Generar Árbol
          </button>
        </div>
      </div>
      <div className="right_panel">
        <div className="top_panel">
          <div className="title_set">
            <h2>Comprobar Palabra</h2>
            <input
              type="text"
              className=""
              value={word}
              onChange={handleChange}
            />
            <div className="derivationTree">
              {steps.length === 0 && word !== "" && (
                <div className="derivation-step">
                  <span>{word} ∉ L G1</span>
                </div>
              )}
              {axiomaticSymbolPartial && steps.length > 0 && (
                <div className="derivation-step">
                  <span>{axiomaticSymbolPartial}</span>
                  {productionsPartials.map((production, index) => (
                    <div key={index} className="derivation-step">
                      <span className="arrow">→</span>
                      <span className="production">
                        {production.nonTerminalSymbol} →{" "}
                        {production.symbolProduced}
                      </span>
                      <span>{steps[index]}</span>
                    </div>
                  ))}
                  <div className="derivation-step">
                    <span>{word} ∈ L G1</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="bottom_panel">
          <div className="title_set">
            <h2>Árbol de Derivación General</h2>
          </div>
          <div className="treeContent">
            {data && <Tree data={data} orientation="vertical" />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DerivationTreeGenerator;
