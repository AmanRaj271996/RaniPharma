using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MedicineStore.API.Data;
using MedicineStore.API.Models;

namespace MedicineStore.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MedicineController : ControllerBase
{
    private readonly AppDbContext _context;

    public MedicineController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<Medicine>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? category,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = _context.Medicines.Where(m => m.IsActive);

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(m =>
                m.Name.Contains(search) ||
                m.Manufacturer.Contains(search) ||
                m.BatchNumber.Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(m => m.Category == category);
        }

        var total = await query.CountAsync();
        var medicines = await query
            .OrderBy(m => m.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        Response.Headers.Append("X-Total-Count", total.ToString());
        Response.Headers.Append("X-Page", page.ToString());
        Response.Headers.Append("X-Page-Size", pageSize.ToString());

        return Ok(medicines);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<Medicine>> GetById(int id)
    {
        var medicine = await _context.Medicines.FindAsync(id);
        if (medicine == null) return NotFound();
        return Ok(medicine);
    }

    [HttpPost]
    public async Task<ActionResult<Medicine>> Create([FromBody] MedicineCreateRequest request)
    {
        var medicine = new Medicine
        {
            Name = request.Name,
            Manufacturer = request.Manufacturer,
            Category = request.Category,
            BatchNumber = request.BatchNumber,
            Price = request.Price,
            StockQuantity = request.StockQuantity,
            ExpiryDate = request.ExpiryDate
        };

        _context.Medicines.Add(medicine);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = medicine.Id }, medicine);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Medicine>> Update(int id, [FromBody] MedicineUpdateRequest request)
    {
        var medicine = await _context.Medicines.FindAsync(id);
        if (medicine == null) return NotFound();

        if (request.Name != null) medicine.Name = request.Name;
        if (request.Manufacturer != null) medicine.Manufacturer = request.Manufacturer;
        if (request.Category != null) medicine.Category = request.Category;
        if (request.BatchNumber != null) medicine.BatchNumber = request.BatchNumber;
        if (request.Price.HasValue) medicine.Price = request.Price.Value;
        if (request.StockQuantity.HasValue) medicine.StockQuantity = request.StockQuantity.Value;
        if (request.ExpiryDate.HasValue) medicine.ExpiryDate = request.ExpiryDate.Value;
        if (request.IsActive.HasValue) medicine.IsActive = request.IsActive.Value;

        medicine.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(medicine);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var medicine = await _context.Medicines.FindAsync(id);
        if (medicine == null) return NotFound();

        medicine.IsActive = false;
        medicine.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("categories")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<string>>> GetCategories()
    {
        var categories = await _context.Medicines
            .Where(m => m.IsActive)
            .Select(m => m.Category)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync();

        return Ok(categories);
    }

    [HttpGet("stats")]
    public async Task<ActionResult> GetStats()
    {
        var totalMedicines = await _context.Medicines.CountAsync(m => m.IsActive);
        var lowStock = await _context.Medicines.CountAsync(m => m.IsActive && m.StockQuantity < 10);
        var expiringSoon = await _context.Medicines.CountAsync(m =>
            m.IsActive && m.ExpiryDate <= DateTime.UtcNow.AddMonths(3));
        var totalValue = await _context.Medicines
            .Where(m => m.IsActive)
            .SumAsync(m => m.Price * m.StockQuantity);

        return Ok(new
        {
            totalMedicines,
            lowStock,
            expiringSoon,
            totalInventoryValue = totalValue
        });
    }
}
