import UniversityHeader from "./UniversityHeader";
import AuthorSection from "./AuthorSection";
import SupervisorSection from "./SupervisorSection";
import DocumentMeta from "./DocumentMeta";

export default function DocumentHeader({

  title,

  university,

  faculty,

  department,

  logo,

  author,

  supervisor,

  type,

  academicYear,

}) {

  return (

    <header className="mb-16">

      <UniversityHeader

        university={university}

        faculty={faculty}

        department={department}

        logo={logo}

      />

      <h1 className="text-4xl text-center font-bold my-16">

        {title}

      </h1>

      <AuthorSection

        author={author}

      />

      <SupervisorSection

        supervisor={supervisor}

      />

      <DocumentMeta

        type={type}

        academicYear={academicYear}

      />

    </header>

  );

}