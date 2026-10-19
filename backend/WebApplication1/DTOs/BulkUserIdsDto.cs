using System.ComponentModel.DataAnnotations;

namespace WebApplication1.DTOs
{
    public class BulkUserIdsDto
    {
        [Required]
        [MinLength(1, ErrorMessage = "Select at least one user.")]
        public List<int> Ids { get; set; } = new();
    }
}