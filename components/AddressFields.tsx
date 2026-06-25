import { COUNTRIES, US_STATES, requiresState, requiresPostalCode } from "@/lib/countries";

interface AddressFieldsProps {
  prefix: "pickup" | "recipient";
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export default function AddressFields({ prefix, formData, onChange }: AddressFieldsProps) {
  const countryKey = `${prefix}Country`;
  const stateKey = `${prefix}State`;
  const postalKey = `${prefix}PostalCode`;
  const cityKey = `${prefix}City`;
  const addressKey = `${prefix}Address`;

  const selectedCountry = formData[countryKey];
  const showState = requiresState(selectedCountry);
  const showPostal = requiresPostalCode(selectedCountry);

  const label = prefix === "pickup" ? "Dirección de Recogida" : "Dirección de Entrega";

  return (
    <div className="space-y-4">
      {/* Country */}
      <div>
        <label className="block text-gray-700 font-semibold mb-2">País *</label>
        <select
          name={countryKey}
          value={selectedCountry}
          onChange={onChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
        >
          <option value="">Selecciona un país</option>
          {COUNTRIES.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      {/* Address */}
      <div>
        <label className="block text-gray-700 font-semibold mb-2">
          Dirección Completa *
        </label>
        <input
          type="text"
          name={addressKey}
          value={formData[addressKey]}
          onChange={onChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
          placeholder="Calle, número, apto/suite"
        />
      </div>

      {/* City */}
      <div>
        <label className="block text-gray-700 font-semibold mb-2">Ciudad *</label>
        <input
          type="text"
          name={cityKey}
          value={formData[cityKey]}
          onChange={onChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
          placeholder="Ciudad"
        />
      </div>

      {/* State (conditional for US/CA) */}
      {showState && (
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Estado *
          </label>
          <select
            name={stateKey}
            value={formData[stateKey] || ""}
            onChange={onChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
          >
            <option value="">Selecciona un estado</option>
            {US_STATES.map((state) => (
              <option key={state.code} value={state.code}>
                {state.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Postal Code (conditional for US/CA) */}
      {showPostal && (
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Código Postal *
          </label>
          <input
            type="text"
            name={postalKey}
            value={formData[postalKey] || ""}
            onChange={onChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
            placeholder={selectedCountry === "US" ? "12345" : "M5V 3A8"}
          />
        </div>
      )}
    </div>
  );
}
