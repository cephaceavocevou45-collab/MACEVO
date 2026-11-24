import { useState } from "react";
import { Link } from "react-router-dom";

import authService from "../../services/authService";


export default function ForgotPassword() {

  const [email, setEmail] = useState("");

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");



  const handleSubmit = async (e) => {

    e.preventDefault();

    setMessage("");
    setError("");


    try {

      await authService.forgotPassword({
        email,
      });


      setMessage(
        "Un lien de récupération a été envoyé à votre adresse email."
      );


    } catch (err) {


      console.error(err);



      if (err.response) {

        setError(
          "Cette adresse email n'existe pas."
        );

      } else {

        setError(
          "Impossible de contacter le serveur."
        );

      }


    }


  };



  return (

    <div className="max-w-md mx-auto bg-white shadow-lg rounded-xl p-8">


      <h1 className="text-3xl font-bold text-center mb-2">

        Mot de passe oublié

      </h1>


      <p className="text-center text-gray-500 mb-6">

        Entrez votre email pour récupérer votre compte.

      </p>




      {error && (

        <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">

          {error}

        </div>

      )}



      {message && (

        <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4">

          {message}

        </div>

      )}




      <form onSubmit={handleSubmit}>


        <div className="mb-5">


          <label className="block font-medium mb-2">

            Adresse Gmail

          </label>



          <input

            type="email"

            placeholder="exemple@gmail.com"

            className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"


            value={email}



            onChange={(e)=>{

              setEmail(e.target.value);

              setError("");

            }}



            required


          />


        </div>




        <button

          type="submit"

          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition"

        >

          Envoyer le lien

        </button>



      </form>





      <div className="text-center mt-5">


        <Link

          to="/connexion"

          className="text-blue-600 hover:underline"

        >

          Retour à la connexion

        </Link>


      </div>



    </div>

  );

}